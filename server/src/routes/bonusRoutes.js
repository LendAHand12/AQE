import express from 'express';
import { protect } from '../middleware/auth.js';
import { getBonusInfo, claimBonus, claimUsdtInterest } from '../controllers/bonusController.js';

const router = express.Router();

router.get('/info', protect, getBonusInfo);
router.post('/claim', protect, claimBonus);
router.post('/claim-interest', protect, claimUsdtInterest);

export default router;
