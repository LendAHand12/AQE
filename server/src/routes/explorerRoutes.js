import express from 'express';
import { 
    getExplorerStats, 
    getLatestBlocks, 
    getLatestTransactions,
    seedTokenData
} from '../controllers/blockchainController.js';

const router = express.Router();

// Public Explorer Routes
router.get('/stats', getExplorerStats);
router.get('/blocks', getLatestBlocks);
router.get('/transactions', getLatestTransactions);
router.post('/seed', seedTokenData);

export default router;
