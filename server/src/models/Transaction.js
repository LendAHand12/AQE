import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema({
    // hash is optional for PENDING transactions, will be updated by listener
    hash: { 
        type: String, 
        unique: true, 
        sparse: true // This allows multiple documents to have no hash (null)
    },
    paymentId: { 
        type: Number, 
        unique: true, 
        sparse: true 
    },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    to: { type: String, default: 'System' },
    amount: { type: Number, required: true },
    symbol: { type: String, default: 'USDT' },
    type: { type: String, enum: ['PAYMENT', 'DEPOSIT', 'WITHDRAW', 'PLEDGE'], default: 'PAYMENT' },
    status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED', 'EXPIRED'], default: 'SUCCESS' },
    description: { type: String },
    metadata: { type: Object }
}, { timestamps: true });

// Ensure indexes are correctly applied
transactionSchema.index({ from: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
