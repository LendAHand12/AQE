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
    confirmManualPayment,
    cancelPayment
} from '../controllers/paymentController.js';
import {
    getUserCommissions,
    getUserBalanceHistory
} from '../controllers/balanceController.js';
import {
    buyToken,
    sellToken
} from '../controllers/blockchainController.js';
import { protect } from '../middleware/auth.js';
import { getPackages } from '../controllers/packageController.js';

const router = express.Router();

// Pre-Register & Checkout
router.post('/pledge', protect, submitPreRegisterPledge);
router.post('/create', protect, createPayment);
router.post('/confirm-hash', protect, confirmTransactionHash);
router.post('/confirm-manual', protect, confirmManualPayment);
router.post('/cancel', protect, cancelPayment);
router.get('/pledge', protect, getMyPreRegister);
router.get('/history', protect, getPaymentHistory);
router.get('/my-payments', protect, getUserPayments);
router.get('/packages', protect, getPackages);
router.get('/purchase-limits', protect, getPurchaseLimits);
// Financial History & Stats
router.get('/my-commissions', protect, getUserCommissions);
router.get('/my-balance-history', protect, getUserBalanceHistory);

// Trading Operations
router.post('/buy', protect, buyToken);
router.post('/sell', protect, sellToken);

router.get('/:paymentId', getPaymentById);

export default router;
