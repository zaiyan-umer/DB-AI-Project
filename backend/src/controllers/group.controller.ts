import { Request, Response } from 'express';
import { z } from 'zod';
import { newGroupSchema } from '../db/schema/group.schema';
import { addMember, checkExistingGroupById, checkExistingGroupByName, checkIfMember, createGroupAndSetAdmin, getAllMembers, searchGroupsByName } from '../services/dal/groups.dal';

export const createGroup = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const parsed = newGroupSchema
        .pick({ name: true })        // only expose fields the user should send
        .safeParse(req.body);

    if (!parsed.success) {
        console.log(parsed.error.format());
        return res.status(400).json({
            message: 'Invalid input',
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { name } = parsed.data;

    // Check for duplicate name before insert
    const existing = await checkExistingGroupByName(name)

    if (existing.length > 0) {
        return res.status(409).json({ message: 'A group with this name already exists' });
    }

    const result = await createGroupAndSetAdmin(name, userId)

    return res.status(201).json({ message: 'Group created', group: result });
};


export const searchGroups = async (req: Request, res: Response) => {
    // Validate and parse req.query against the insert schema
    const parsed = newGroupSchema
        .pick({ name: true })
        .safeParse(req.query);

    if (!parsed.success) {
        console.log(parsed.error.format());
        return res.status(400).json({
            message: 'Invalid input',
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { name } = parsed.data;

    // the next line removes quotes from the name
    const cleanedName = name.trim().replace(/^(["'])(.*)\1$/, '$2').trim();

    const results = await searchGroupsByName(cleanedName)

    return res.status(200).json({ groups: results });
};


export const joinGroup = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    console.log(req.user);

    const parsed = z
        .object({ groupId: z.string().uuid() })
        .safeParse(req.params);

    if (!parsed.success) {
        console.log(parsed.error.format());
        return res.status(400).json({
            message: 'Invalid input',
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { groupId } = parsed.data;

    // Confirm the group exists
    const group = await checkExistingGroupById(groupId)

    if (group.length === 0) {
        return res.status(404).json({ message: 'Group not found' });
    }

    // Check if already a member
    const membership = await checkIfMember(userId, groupId)

    if (membership.length > 0) {
        return res.status(200).json({ message: 'Already a member' });
    }

    await addMember(userId, groupId)

    return res.status(201).json({ message: 'Joined group successfully' });
};

export const getGroupMembers = async (req: Request, res: Response) => {
    const parsed = z
        .object({ groupId: z.string().uuid() })
        .safeParse(req.params);

    if (!parsed.success) {
        console.log(parsed.error.format());
        return res.status(400).json({
            message: 'Invalid input',
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { groupId } = parsed.data;

    // Confirm group exists
    const group = await checkExistingGroupById(groupId)

    if (group.length === 0) {
        return res.status(404).json({ message: 'Group not found' });
    }

    const members = await getAllMembers(groupId)

    return res.status(200).json({
        group: group[0],
        members,
        total: members.length,
    });
};