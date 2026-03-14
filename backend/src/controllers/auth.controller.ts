import crypto from "crypto";
import type { Request, Response } from "express";
import { newUser } from "../db/schema/user.schema";
import { deleteToken, getToken, insertToken } from "../services/dal/tokens.dal";
import { checkExistingUser, getUserById, insertUser, updateUserPassword } from "../services/dal/users.dal";
import { compareHash, hashPassword, hashResetToken } from "../utils/hashing.utils";
import { generateToken } from "../utils/jwt";
import { sendForgotPasswordEmail } from "../utils/mailer";
import { getEventsByUser, insertEvent, removeEvent, getStudyPlanByUser, upsertStudyPlan, getNotificationsWithEventDetails, markNotificationAsRead, removeNotification, removeAllNotifications, getLogsByUser,  upsertWeeklyLog, deleteLogsByCourse, getCurrentWeekStart, } from '../services/dal/scheduler.dal'

export const register = async (req: Request<any, any, newUser>, res: Response) => {
    try {
        const existingUser = await checkExistingUser(req.body.email)

        if (existingUser) {
            return res.status(409).json({
                message: "Email already in use"
            })
        }

        const hashedPassword = await hashPassword(req.body.password)

        const user = await insertUser({ ...req.body }, hashedPassword)

        const { password, ...userWithoutPassword } = user;

        return res.status(201).json({
            message: 'User created successfully',
            user: userWithoutPassword
        })
    }
    catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "User creation failed"
        })
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body
        const existingUser = await checkExistingUser(email)

        if (!existingUser) {
            return res.status(401).json({
                message: "Invalid Credentials"
            })
        }

        const isPasswordValid = await compareHash(password, existingUser.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid Credentials"
            })
        }

        const token = generateToken({
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username as string
        });

        const { password: _, ...userWithoutPassword } = existingUser;

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24
        });

        res.status(200).json({
            message: 'User logged-in successfully',
            user: userWithoutPassword,
        });
    }
    catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "Login failed"
        })
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie('token')
        return res.status(200).json({
            message: 'User logged-out successfully',
        });
    }
    catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "Logout failed"
        })
    }
}

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const existingUser = await checkExistingUser(email);

        // Don't reveal if the user exists
        if (!existingUser) {
            return res.status(200).json({
                message: "If an account exists, a reset email has been sent"
            });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = hashResetToken(rawToken);

        await insertToken(existingUser.id, hashedToken);

        // Respond immediately
        res.status(200).json({
            message: "If an account exists, a reset email has been sent"
        });

        // Send email in background
        sendForgotPasswordEmail(existingUser.email, existingUser.username as string, rawToken)
            .catch(err => console.error("Email failed:", err));

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Failed to process password reset"
        });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token: rawToken, password } = req.body
        const hashedToken = hashResetToken(rawToken)

        const [token] = await getToken(hashedToken)

        if (!token) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            })
        }

        // Check if token is expired
        if (new Date() > new Date(token.expiresAt)) {
            await deleteToken(token.id)
            return res.status(400).json({
                message: "Reset token has expired"
            })
        }

        // Update user password
        const hashedPassword = await hashPassword(password)
        await updateUserPassword(token.userId, hashedPassword)

        // Delete the used token
        await deleteToken(token.id)

        return res.status(200).json({
            message: "Password reset successfully"
        })
    }
    catch (err) {
        console.error(err)

        return res.status(500).json({
            message: "Failed to reset password"
        })
    }
}

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const currentUser = await getUserById(req.user.id);

        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ user: currentUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Current user retrieval failed" });
    }
};


// ---- Events ---------------------------------------------------------------

export const getEvents = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const data = await getEventsByUser(userId)
        return res.status(200).json(data)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch events' })
    }
}

export const createEvent = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const { title, course, type, priority, date, time } = req.body

        const event = await insertEvent({
            userId,
            title,
            course,
            type,
            priority,
            date: new Date(date),
            time,
        })

        return res.status(201).json(event)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to create event' })
    }
}

export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const id = req.params.id as string

        const deleted = await removeEvent(id, userId)
        if (!deleted) return res.status(404).json({ message: 'Event not found' })

        return res.status(200).json({ message: 'Event deleted' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to delete event' })
    }
}

// ---- Study Plans ----------------------------------------------------------

export const getStudyPlan = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const plan = await getStudyPlanByUser(userId)
        return res.status(200).json(plan)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch study plan' })
    }
}

export const saveStudyPlan = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const { name, courses } = req.body

        if (!Array.isArray(courses)) {
            return res.status(400).json({ message: 'courses must be an array' })
        }

        const plan = await upsertStudyPlan(userId, { name, courses })
        return res.status(200).json(plan)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to save study plan' })
    }
}

// ---- Notifications --------------------------------------------------------

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        // Uses LEFT JOIN with events table to include event details
        const data = await getNotificationsWithEventDetails(userId)
        return res.status(200).json(data.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch notifications' })
    }
}

export const markRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const id = req.params.id as string

        const updated = await markNotificationAsRead(id, userId)
        if (!updated) return res.status(404).json({ message: 'Notification not found' })

        return res.status(200).json(updated)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to mark notification as read' })
    }
}

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const id = req.params.id as string

        const deleted = await removeNotification(id, userId)
        if (!deleted) return res.status(404).json({ message: 'Notification not found' })

        return res.status(200).json({ message: 'Notification deleted' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to delete notification' })
    }
}

export const deleteAllNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        await removeAllNotifications(userId)
        return res.status(200).json({ message: 'All notifications cleared' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to clear notifications' })
    }
}

// ---- Study Plan Logs ------------------------------------------------------

export const getPlanLogs = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const logs = await getLogsByUser(userId)
        return res.status(200).json(logs)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch plan logs' })
    }
}

/**
 * Save weekly log for one course.
 * Body: { studyPlanId, course, scheduledHours: number[7], dayStatuses: (string|null)[7] }
 */
export const savePlanLogs = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const { studyPlanId, course, scheduledHours, dayStatuses } = req.body

        if (!studyPlanId || !course || !Array.isArray(scheduledHours) || !Array.isArray(dayStatuses)) {
            return res.status(400).json({ message: 'studyPlanId, course, scheduledHours, dayStatuses required' })
        }

        const weekStart = getCurrentWeekStart()
        const saved = await upsertWeeklyLog(userId, studyPlanId, course, weekStart, scheduledHours, dayStatuses)
        return res.status(200).json(saved)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to save plan logs' })
    }
}

/**
 * Delete all logs for a course (called when user deletes a confirmed course).
 * Also removes that course from the study plan's courses JSON.
 */
export const deleteCourseData = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id
        const { studyPlanId, course } = req.body

        if (!studyPlanId || !course) {
            return res.status(400).json({ message: 'studyPlanId and course required' })
        }

        // 1. Delete all logs for this course
        await deleteLogsByCourse(userId, studyPlanId, course)

        // 2. Remove course from study plan's courses JSONB array
        const plan = await getStudyPlanByUser(userId)
        if (plan) {
            const courses = (plan.courses as any[]).filter((c: any) => c.course !== course)
            await upsertStudyPlan(userId, { courses })
        }

        return res.status(200).json({ message: 'Course deleted' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to delete course data' })
    }
}