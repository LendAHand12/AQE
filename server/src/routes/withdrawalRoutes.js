import express from 'express';
import { 
    requestWithdrawal, 
    completeWithdrawal,
    getMyWithdrawalHistory, 
    getPendingWithdrawals, 
    getAllWithdrawals,
    approveWithdrawal, 
    rejectWithdrawal 
} from '../controllers/withdrawalController.js';
import { protect, adminProtect } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/request', protect, requestWithdrawal);
router.post('/complete', protect, completeWithdrawal);
router.get('/my-history', protect, getMyWithdrawalHistory);

// Admin routes
router.get('/admin/pending', adminProtect, getPendingWithdrawals);
router.get('/admin/all', adminProtect, getAllWithdrawals);
router.put('/admin/:id/approve', adminProtect, approveWithdrawal);
router.put('/admin/:id/reject', adminProtect, rejectWithdrawal);

export default router;
