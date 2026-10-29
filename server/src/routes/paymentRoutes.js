import express from 'express';
import {
    submitPreRegisterPledge,
    getMyPreRegister,
    getUserPayments,
    createPayment,
    getPurchaseLimits,
    getPaymentById,
    getPaymentHistory,
    confirmTransactionHash,
    refreshPayment,
    confirmManualPayment,
    cancelPayment
} from '../controllers/paymentController.js';
import {
    getUserCommissions,
    getUserBalanceHistory,
    getCommissionSummary,
    claimCommissions
} from '../controllers/balanceController.js';
import {
    buyToken,
    sellToken
} from '../controllers/blockchainController.js';
import { protect } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { getPackages } from '../controllers/packageController.js';

const router = express.Router();

const submitLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
const refreshLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

// Pre-Register & Checkout
router.post('/pledge', protect, submitPreRegisterPledge);
router.post('/create', protect, createPayment);
router.post('/confirm-hash', protect, submitLimiter, confirmTransactionHash);
router.post('/refresh', protect, refreshLimiter, refreshPayment);
router.post('/confirm-manual', protect, confirmManualPayment);
router.post('/cancel', protect, cancelPayment);
router.get('/pledge', protect, getMyPreRegister);
router.get('/history', protect, getPaymentHistory);
router.get('/my-payments', protect, getUserPayments);
router.get('/packages', protect, getPackages);
router.get('/purchase-limits', protect, getPurchaseLimits);
// Financial History & Stats
router.get('/my-commissions', protect, getUserCommissions);
router.get('/commission-summary', protect, getCommissionSummary);
router.post('/claim-commissions', protect, claimCommissions);
router.get('/my-balance-history', protect, getUserBalanceHistory);

// Trading Operations
router.post('/buy', protect, buyToken);
router.post('/sell', protect, sellToken);

router.get('/:paymentId', getPaymentById);

export default router;
