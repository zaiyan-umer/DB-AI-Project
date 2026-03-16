import { Request, Response } from 'express';
import { addMember, checkExistingGroupById, checkExistingGroupByName, checkIfMember, createGroupAndSetAdmin, getAllMembers, getMyGroupsFromDB, searchGroupsByName } from '../services/dal/groups.dal';

export const createGroup = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const { name } = req.body;

    // Check for duplicate name before insert
    const existing = await checkExistingGroupByName(name)

    if (existing.length > 0) {
        return res.status(409).json({ message: 'A group with this name already exists' });
    }

    const result = await createGroupAndSetAdmin(name, userId)

    return res.status(201).json({ message: 'Group created', group: result });
};


export const searchGroups = async (req: Request, res: Response) => {
    const name = req.query.name as string;

    const cleanedName = name.trim().replace(/^(["'])(.*)\1$/, '$2').trim();

    const results = await searchGroupsByName(cleanedName)

    return res.status(200).json({ groups: results });
};


export const joinGroup = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const groupId = req.params.groupId as string;

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
    const groupId = req.params.groupId as string;

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

export const getMyGroups = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await getMyGroupsFromDB(userId)
    return res.status(200).json({ groups: result });
};