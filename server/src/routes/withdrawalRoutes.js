import express from 'express';
import { 
    requestWithdrawal, 
    getMyWithdrawalHistory, 
    getPendingWithdrawals, 
    approveWithdrawal, 
    rejectWithdrawal 
} from '../controllers/withdrawalController.js';
import { protect, adminProtect } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/request', protect, requestWithdrawal);
router.get('/my-history', protect, getMyWithdrawalHistory);

// Admin routes
router.get('/admin/pending', protect, adminProtect, getPendingWithdrawals);
router.put('/admin/:id/approve', protect, adminProtect, approveWithdrawal);
router.put('/admin/:id/reject', protect, adminProtect, rejectWithdrawal);

export default router;
