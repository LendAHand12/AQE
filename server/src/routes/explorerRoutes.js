import express from 'express';
import { 
    getExplorerStats, 
    getLatestBlocks, 
    getLatestTransactions,
    buyToken,
    sellToken,
    seedTokenData
} from '../controllers/blockchainController.js';
import {
    submitPreRegisterPledge,
    getMyPreRegister,
    submitPreRegisterPayment,
    getUserPayments
} from '../controllers/paymentController.js';
import {
    getUserCommissions,
    getUserBalanceHistory
} from '../controllers/balanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public Routes
router.get('/stats', getExplorerStats);
router.get('/blocks', getLatestBlocks);
router.get('/transactions', getLatestTransactions);
router.post('/seed', seedTokenData);

// Protected (Simulation)
router.post('/buy', protect, buyToken);
router.post('/sell', protect, sellToken);

// Pre-Register & Payments
router.post('/pledge', protect, submitPreRegisterPledge);
router.post('/payment', protect, submitPreRegisterPayment);
router.get('/pledge', protect, getMyPreRegister);
router.get('/my-payments', protect, getUserPayments);

// Balance & Commissions
router.get('/my-commissions', protect, getUserCommissions);
router.get('/my-balance-history', protect, getUserBalanceHistory);

export default router;
