import express from 'express';
import { verifyToken } from '../middleware/verifyToken.middleware';
import { getEvents, createEvent, deleteEvent, getStudyPlan, saveStudyPlan, getNotifications, markRead, deleteNotification, deleteAllNotifications, getPlanLogs, savePlanLogs, deleteCourseData,} from '../controllers/auth.controller'

const router = express.Router();
router.use(verifyToken);

// Events
router.get('/events', getEvents)
router.post('/events', createEvent)
router.delete('/events/:id', deleteEvent)

// Study Plan
router.get('/study-plan', getStudyPlan)
router.post('/study-plan', saveStudyPlan)

// Study Plan Logs
router.get('/plan-logs', getPlanLogs)
router.post('/plan-logs', savePlanLogs)
router.delete('/plan-logs/delete-course', deleteCourseData)  // must be before /:id style routes

// Notifications
router.get('/notifications', getNotifications)
router.patch('/notifications/:id/read', markRead)
router.delete('/notifications', deleteAllNotifications)      // must be before /:id
router.delete('/notifications/:id', deleteNotification)

export default router;