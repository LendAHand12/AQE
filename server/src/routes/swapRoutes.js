import express from 'express';
import {
    proxyAmc20Rpc,
    createSwapRequest,
    getSwapWalletInfo,
    submitSwapWallet,
    getAllSwapRequests,
    getSwapRequestById,
    createManualSwapRequest,
    approveSwapRequest,
    rejectSwapRequest,
    completeSwapRequest
} from '../controllers/swapController.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/rpc-proxy', proxyAmc20Rpc);
router.post('/', createSwapRequest);
router.get('/wallet/:token', getSwapWalletInfo);
router.post('/wallet/:token', submitSwapWallet);

// Admin routes
router.get('/admin/all', adminProtect, getAllSwapRequests);
router.post('/admin/manual', adminProtect, createManualSwapRequest);
router.get('/admin/:id', adminProtect, getSwapRequestById);
router.put('/admin/:id/approve', adminProtect, approveSwapRequest);
router.put('/admin/:id/reject', adminProtect, rejectSwapRequest);
router.put('/admin/:id/complete', adminProtect, completeSwapRequest);

export default router;
