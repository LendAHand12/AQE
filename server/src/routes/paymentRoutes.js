import express from 'express';
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
import {
    buyToken,
    sellToken
} from '../controllers/blockchainController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Pre-Register & Checkout
router.post('/pledge', protect, submitPreRegisterPledge);
router.post('/payment', protect, submitPreRegisterPayment);
router.get('/pledge', protect, getMyPreRegister);
router.get('/my-payments', protect, getUserPayments);

// Trading Operations
router.post('/buy', protect, buyToken);
router.post('/sell', protect, sellToken);

// Financial History & Stats
router.get('/my-commissions', protect, getUserCommissions);
router.get('/my-balance-history', protect, getUserBalanceHistory);

export default router;
