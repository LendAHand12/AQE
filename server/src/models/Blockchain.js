import mongoose from 'mongoose';
import Transaction from './Transaction.js';

// --- BLOCK MODEL ---
const blockSchema = mongoose.Schema({
    number: { type: Number, required: true, unique: true },
    hash: { type: String, required: true, unique: true },
    parentHash: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    miner: { type: String, default: 'AQE System' }
}, { timestamps: true });

export const Block = mongoose.model('Block', blockSchema);
export { Transaction };

// --- TOKEN SETTINGS & STATE ---
const tokenStateSchema = mongoose.Schema({
    symbol: { type: String, default: 'AQE' },
    name: { type: String, default: 'AQ Estate Token' },
    totalSupply: { type: Number, default: 100000000 },
    circulatingSupply: { type: Number, default: 0 },
    currentPrice: { type: Number, default: 0.1 }, // In USDT
    usdtPool: { type: Number, default: 10000 },   // Initial pool
    marketCap: { type: Number, default: 10000000 }
}, { timestamps: true });

export const TokenState = mongoose.model('TokenState', tokenStateSchema);
