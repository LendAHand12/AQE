import express from 'express';
import {
    submitPreRegisterPledge,
    getMyPreRegister,
    submitPreRegisterPayment,
    getUserPayments,
    createPayment,
    getPaymentById,
    getPaymentHistory,
    confirmTransactionHash,
    confirmManualPayment
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
router.post('/payment', protect, submitPreRegisterPayment);
router.post('/create', protect, createPayment);
router.post('/confirm-hash', confirmTransactionHash);
router.post('/confirm-manual', protect, confirmManualPayment);
router.get('/pledge', protect, getMyPreRegister);
router.get('/history', protect, getPaymentHistory);
router.get('/my-payments', protect, getUserPayments);
router.get('/packages', protect, getPackages);
// Financial History & Stats
router.get('/my-commissions', protect, getUserCommissions);
router.get('/my-balance-history', protect, getUserBalanceHistory);

// Trading Operations
router.post('/buy', protect, buyToken);
router.post('/sell', protect, sellToken);

router.get('/:paymentId', getPaymentById);

export default router;
