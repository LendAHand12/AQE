import express from 'express';
import { 
    getUserNotifications, 
    markAsRead, 
    markAllAsRead 
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(protect, getUserNotifications);

router.route('/read-all')
    .put(protect, markAllAsRead);

router.route('/:id/read')
    .put(protect, markAsRead);

export default router;
