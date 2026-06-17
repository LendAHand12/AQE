import express from 'express';
import { getPlinkoInfo, playPlinko } from '../controllers/plinkoController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/info', protect, getPlinkoInfo);
router.post('/play', protect, playPlinko);

export default router;
