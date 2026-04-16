import crypto from 'crypto';
import { Block, Transaction, TokenState } from '../models/Blockchain.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';

// Helper to generate a dummy hash
const generateHash = (data) => {
    return crypto.createHash('sha256').update(data + Date.now()).digest('hex');
};

// @desc    Get Latest Stats
export const getExplorerStats = async (req, res) => {
    try {
        let stats = await TokenState.findOne({ symbol: 'AQE' });
        
        // If not found, return a default object to avoid 500
        if (!stats) {
            return res.json({
                symbol: 'AQE',
                name: 'AQ Estate Token',
                totalSupply: 100000000,
                currentPrice: 0.1,
                usdtPool: 10000,
                circulatingSupply: 0,
                latestBlock: 0,
                totalTransactions: 0
            });
        }

        const latestBlock = await Block.findOne({}, {}, { sort: { 'number': -1 } });
        const totalTxns = await Transaction.countDocuments();

        res.json({
            ...stats._doc,
            latestBlock: latestBlock ? latestBlock.number : 0,
            totalTransactions: totalTxns
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Latest Blocks
export const getLatestBlocks = async (req, res) => {
    try {
        const blocks = await Block.find().sort({ number: -1 }).limit(10);
        res.json(blocks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Latest Transactions
export const getLatestTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10).populate('fromUser', 'firstName lastName');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Seed Initial Token Data
export const seedTokenData = async (req, res) => {
    try {
        let stats = await TokenState.findOne({ symbol: 'AQE' });
        if (!stats) {
            stats = await TokenState.create({
                symbol: 'AQE',
                name: 'AQ Estate Token',
                totalSupply: 100000000,
                currentPrice: 0.1,
                usdtPool: 10000
            });
        }
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Simulate Buying Token
export const buyToken = async (req, res) => {
    const { amountUsdt } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Skip balance check for simulation purposes, but we update balances
        // if (user.usdtBalance < amountUsdt) return res.status(400).json({ message: 'Insufficient USDT' });

        const stats = await TokenState.findOne({ symbol: 'AQE' });
        const tokensToReceive = amountUsdt / stats.currentPrice;

        // 1. Create Transaction
        const txn = await Transaction.create({
            hash: '0x' + generateHash('buy'),
            from: userId,
            to: 'Contract_AQE',
            amount: tokensToReceive,
            symbol: 'AQE',
            type: 'BUY',
            status: 'SUCCESS'
        });

        // 2. Update User Balances
        user.usdtBalance -= amountUsdt;
        user.aqeBalance += tokensToReceive;
        await user.save();

        // 3. Update Token Stats & Price
        stats.usdtPool += amountUsdt;
        stats.circulatingSupply += tokensToReceive;
        stats.currentPrice += (amountUsdt / 1000000); 
        await stats.save();

        // 4. Mine Block
        const latestBlock = await Block.findOne({}, {}, { sort: { 'number': -1 } });
        const newBlockNumber = latestBlock ? latestBlock.number + 1 : 1;
        const parentHash = latestBlock ? latestBlock.hash : '0x0000000000000000000000000000000000000000';

        const newBlock = await Block.create({
            number: newBlockNumber,
            hash: '0x' + generateHash('block' + newBlockNumber),
            parentHash: parentHash,
            transactions: [txn._id]
        });

        txn.blockNumber = newBlock.number;
        await txn.save();

        res.json({
            message: 'Mua thành công',
            tokensReceived: tokensToReceive,
            newPrice: stats.currentPrice
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Simulate Selling Token
export const sellToken = async (req, res) => {
    const { amountAqe } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (user.aqeBalance < amountAqe) return res.status(400).json({ message: 'Số dư AQE không đủ' });

        const stats = await TokenState.findOne({ symbol: 'AQE' });
        const usdtToReceive = amountAqe * stats.currentPrice;

        const txn = await Transaction.create({
            hash: '0x' + generateHash('sell'),
            from: userId,
            to: 'Contract_AQE',
            amount: amountAqe,
            symbol: 'AQE',
            type: 'SELL',
            status: 'SUCCESS'
        });

        user.aqeBalance -= amountAqe;
        user.usdtBalance += usdtToReceive;
        await user.save();

        stats.usdtPool -= usdtToReceive;
        stats.circulatingSupply -= amountAqe;
        stats.currentPrice -= (usdtToReceive / 1000000);
        if (stats.currentPrice < 0.01) stats.currentPrice = 0.01;
        await stats.save();

        const latestBlock = await Block.findOne({}, {}, { sort: { 'number': -1 } });
        const newBlock = await Block.create({
            number: latestBlock.number + 1,
            hash: '0x' + generateHash('block'),
            parentHash: latestBlock.hash,
            transactions: [txn._id]
        });

        txn.blockNumber = newBlock.number;
        await txn.save();

        res.json({ message: 'Bán thành công', usdtReceived: usdtToReceive, newPrice: stats.currentPrice });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Token Settings (Admin)
export const updateTokenSettings = async (req, res) => {
    const { totalSupply, usdtPool, currentPrice, name, symbol } = req.body;
    try {
        let stats = await TokenState.findOne({ symbol: symbol || 'AQE' });
        if (!stats) {
            stats = new TokenState({ symbol: symbol || 'AQE' });
        }
        
        stats.totalSupply = totalSupply !== undefined ? totalSupply : stats.totalSupply;
        stats.usdtPool = usdtPool !== undefined ? usdtPool : stats.usdtPool;
        stats.currentPrice = currentPrice !== undefined ? currentPrice : stats.currentPrice;
        stats.name = name || stats.name;
        
        const updatedStats = await stats.save();

        // Log the action
        await AdminLog.create({
            adminId: req.admin._id,
            adminUsername: req.admin.username,
            action: 'UPDATE_TOKEN_SETTINGS',
            target: stats.symbol,
            details: { newValues: req.body }
        });

        res.json({ message: 'Cập nhật thông số Token thành công', stats: updatedStats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
