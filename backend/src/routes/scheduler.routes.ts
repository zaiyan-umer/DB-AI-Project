import express from 'express';
import { verifyToken } from '../middleware/verifyToken.middleware';
import { getEvents, createEvent, deleteEvent, getStudyPlan, saveStudyPlan, getNotifications, markRead, deleteNotification,} from '../controllers/auth.controller'

const router = express.Router();
router.use(verifyToken);

// Events
router.get('/events', getEvents)
router.post('/events', createEvent)
router.delete('/events/:id', deleteEvent)

// Study Plan
router.get('/study-plan', getStudyPlan)
router.post('/study-plan', saveStudyPlan)

// Notifications
router.get('/notifications', getNotifications)
router.patch('/notifications/:id/read', markRead)
router.delete('/notifications/:id', deleteNotification)

export default router;