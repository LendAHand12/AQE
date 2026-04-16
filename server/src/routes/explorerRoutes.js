import express from 'express';
import { 
    getExplorerStats, 
    getLatestBlocks, 
    getLatestTransactions,
    buyToken,
    sellToken,
    seedTokenData
} from '../controllers/blockchainController.js';
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

export default router;
