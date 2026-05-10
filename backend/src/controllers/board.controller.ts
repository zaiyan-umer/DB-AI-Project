import type { Request, Response } from "express";
import db from "../db/connection";
import { whiteboards } from "../db/schema";
import { eq } from "drizzle-orm";
import { checkGroupMembership } from "../services/dal/messages.dal";

export const getWhiteboard = async (req: Request, res: Response) => {
    try {
        const groupId = req.params.groupId as string;
        const [board] = await db.select().from(whiteboards).where(eq(whiteboards.groupId, groupId));

        if (!board) {
            return res.status(404).json({
                success: false,
                error: "Board not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: board
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}


export const updateWhiteboard = async (req: Request, res: Response) => {

    try {
        const groupId = req.params.groupId as string;
        const userId = req.params.userId as string;

        // Only group members can send messages
        const membership = await checkGroupMembership(groupId, userId)

        if (membership.length === 0) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const snapshot = req.body;

        const [board] = await db.select().from(whiteboards).where(eq(whiteboards.groupId, groupId));
        if (!board) {
            return res.status(404).json({
                success: false,
                error: "Board not found"
            });
        }
        await db.update(whiteboards).set({ snapshot, updatedAt: new Date() }).where(eq(whiteboards.groupId, groupId));
        
        return res.status(200).json({
            success: true,
            message: "Board updated successfully"
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}
