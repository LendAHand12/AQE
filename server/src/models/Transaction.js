import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema({
    hash: { type: String, required: true, unique: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    symbol: { type: String, default: 'AQE' },
    usdtAmount: { type: Number },
    priceAtTime: { type: Number },
    phase: { type: String, enum: ['PRE_REGISTER', 'LIVE'], default: 'LIVE' },
    type: { type: String, enum: ['BUY', 'SELL', 'TRANSFER', 'DEPOSIT', 'REWARD', 'COMMISSION'], required: true },
    status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], default: 'SUCCESS' },
    isReleased: { type: Boolean, default: false },
    balanceBefore: { type: Number },
    balanceAfter: { type: Number },
    blockNumber: { type: Number },
    description: { type: String }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
