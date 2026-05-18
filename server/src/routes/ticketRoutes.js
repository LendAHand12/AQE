import express from 'express';
import {
    createTicket,
    getUserTickets,
    getTicketById,
    getTicketByIdAdmin,
    getAllTickets,
    replyTicket,
    replyTicketUser,
    resolveTicket,
    closeTicket
} from '../controllers/ticketController.js';
import { protect, adminProtect } from '../middleware/auth.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// User Routes
router.post('/', protect, upload.array('images', 5), createTicket);
router.post('/:id/reply', protect, upload.array('images', 5), replyTicketUser);
router.get('/user', protect, getUserTickets);
router.get('/:id', protect, getTicketById);

// Admin Routes (use /admin prefix to avoid conflict with /:id)
router.get('/admin/all', adminProtect, getAllTickets);
router.get('/admin/:id', adminProtect, getTicketByIdAdmin);
router.put('/admin/:id/reply', adminProtect, upload.array('images', 5), replyTicket);
router.put('/admin/:id/resolve', adminProtect, resolveTicket);
router.put('/admin/:id/close', adminProtect, closeTicket);

export default router;
