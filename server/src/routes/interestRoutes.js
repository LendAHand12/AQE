import express from 'express';
import { protect } from '../middleware/auth.js';
import { getInterestInfo, claimInterest } from '../controllers/interestController.js';

const router = express.Router();

router.get('/info', protect, getInterestInfo);
router.post('/claim', protect, claimInterest);

export default router;
