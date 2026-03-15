import { and, desc, eq, lt } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db/connection";
import { groupMembers, users } from "../db/schema";
import { messageDeletions, messages, newMessageSchema } from "../db/schema/messages.schema";


export const sendMessage = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const parsedParams = newMessageSchema
        .pick({ groupId: true })
        .safeParse(req.params);

    if (!parsedParams.success) {
        console.log(parsedParams.error.format());
        return res.status(400).json({
            message: 'Invalid input',
            errors: parsedParams.error.flatten().fieldErrors
        });
    }

    const { groupId } = parsedParams.data;


    // Validate body
    const parsedBody = newMessageSchema
        .pick({ content: true })
        .safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: parsedBody.error.flatten().fieldErrors,
        });
    }

    // Only group members can send messages
    const membership = await db
        .select({ id: groupMembers.id })
        .from(groupMembers)
        .where(
            and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, userId)
            )
        )
        .limit(1);

    if (membership.length === 0) {
        return res.status(403).json({ message: "You are not a member of this group" });
    }

    const [message] = await db
        .insert(messages)
        .values({ groupId, userId, content: parsedBody.data.content })
        .returning();

    return res.status(201).json({ message });
};

// ─── Fetch Message History (Paginated) ───────────────────────────────────────
// GET /groups/:groupId/messages?cursor=<createdAt>&limit=20
// Cursor-based pagination — cursor is the createdAt of the oldest message
// the client currently has. Each call loads the next batch older than that.
export const getMessages = async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // cap at 50
    const cursor = req.query.cursor as string | undefined; // ISO timestamp string

    // Only members can read messages
    const membership = await db
        .select({ id: groupMembers.id })
        .from(groupMembers)
        .where(
            and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, userId)
            )
        )
        .limit(1);

    if (membership.length === 0) {
        return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Fetch messages that haven't been soft-deleted for everyone
    // and haven't been personally deleted by this user
    const rows = await db
        .select({
            id: messages.id,
            content: messages.content,
            createdAt: messages.createdAt,
            deletedAt: messages.deletedAt, // non-null = deleted for everyone
            sender: {
                id: users.id,
                username: users.username,
                firstName: users.firstName,
                lastName: users.lastName,
            },
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        // Exclude messages this user deleted for themselves
        .where(
            and(
                eq(messages.groupId, groupId),
                // If cursor provided, fetch messages older than cursor
                cursor ? lt(messages.createdAt, new Date(cursor)) : undefined,
            )
        )
        .orderBy(desc(messages.createdAt))
        .limit(limit);

    // Filter out messages the user personally deleted
    // Done in app layer because message_deletions is a separate table
    // For a large app you'd use a subquery — fine at this scale
    const userDeletions = await db
        .select({ messageId: messageDeletions.messageId })
        .from(messageDeletions)
        .where(eq(messageDeletions.userId, userId));

    const deletedForMe = new Set(userDeletions.map((d) => d.messageId));

    const filtered = rows.filter((m) => !deletedForMe.has(m.id));

    // Reverse so frontend receives oldest → newest order
    filtered.reverse();

    return res.status(200).json({
        messages: filtered,
        // If we got a full page, there are likely more messages
        hasMore: rows.length === limit,
        // Client uses this as the next cursor
        nextCursor: rows.length === limit ? rows[rows.length - 1].createdAt : null,
    });
};

// ─── Delete For Me ───────────────────────────────────────────────────────────
// DELETE /messages/:messageId
// Inserts a row into message_deletions — only hides the message for this user
export const deleteForMe = async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const userId = req.user!.id;

    // Confirm message exists
    const message = await db
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

    if (message.length === 0) {
        return res.status(404).json({ message: "Message not found" });
    }

    // Check if already deleted for this user (idempotent)
    const existing = await db
        .select({ id: messageDeletions.id })
        .from(messageDeletions)
        .where(
            and(
                eq(messageDeletions.messageId, messageId),
                eq(messageDeletions.userId, userId)
            )
        )
        .limit(1);

    if (existing.length > 0) {
        return res.status(200).json({ message: "Already deleted" });
    }

    await db.insert(messageDeletions).values({ messageId, userId });

    return res.status(200).json({ message: "Message deleted for you" });
};

// ─── Delete For Everyone ─────────────────────────────────────────────────────
// DELETE /messages/:messageId/everyone
// Soft deletes the message — sets deletedAt on the message row itself
// Only the message author or a group admin can do this
export const deleteForEveryone = async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const userId = req.user!.id;

    // Fetch the message with its groupId so we can check admin status
    const message = await db
        .select({
            id: messages.id,
            userId: messages.userId,
            groupId: messages.groupId,
            deletedAt: messages.deletedAt,
        })
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

    if (message.length === 0) {
        return res.status(404).json({ message: "Message not found" });
    }

    const msg = message[0];

    if (msg.deletedAt) {
        return res.status(200).json({ message: "Already deleted for everyone" });
    }

    // Allow if: user is the message author OR user is a group admin
    const isAuthor = msg.userId === userId;

    const adminCheck = await db
        .select({ role: groupMembers.role })
        .from(groupMembers)
        .where(
            and(
                eq(groupMembers.groupId, msg.groupId!),
                eq(groupMembers.userId, userId)
            )
        )
        .limit(1);

    const isAdmin = adminCheck[0]?.role === "admin";

    if (!isAuthor && !isAdmin) {
        return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await db
        .update(messages)
        .set({ deletedAt: new Date() })
        .where(eq(messages.id, messageId));

    return res.status(200).json({ message: "Message deleted for everyone" });
};