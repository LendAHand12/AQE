import mongoose from 'mongoose';

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

// --- TRANSACTION MODEL ---
const transactionSchema = mongoose.Schema({
    hash: { type: String, required: true, unique: true },
    from: { type: String, required: true }, // _id of user
    to: { type: String, required: true },   // _id of user or 'Contract'
    amount: { type: Number, required: true },
    symbol: { type: String, default: 'AQE' },
    type: { type: String, enum: ['BUY', 'SELL', 'TRANSFER', 'DEPOSIT'], required: true },
    status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], default: 'SUCCESS' },
    blockNumber: { type: Number },
}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);

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
