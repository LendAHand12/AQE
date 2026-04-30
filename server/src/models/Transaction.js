import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema({
    hash: { type: String, required: true, unique: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    to: { type: String, default: 'System' },
    amount: { type: Number, required: true }, // Total amount in USDT
    symbol: { type: String, default: 'USDT' },
    type: { type: String, enum: ['PAYMENT', 'DEPOSIT', 'WITHDRAW'], default: 'PAYMENT' },
    status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], default: 'SUCCESS' },
    description: { type: String }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
