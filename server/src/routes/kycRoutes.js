import express from 'express';
import { startFaceScan, completeFaceScan } from '../controllers/kycController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/start-face-scan', protect, startFaceScan);
router.post('/complete-face-scan', protect, completeFaceScan);

export default router;
