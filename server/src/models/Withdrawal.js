import mongoose from 'mongoose';

const withdrawalSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    walletAddress: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    fee: {
        type: Number,
        default: 1.0
    },
    symbol: {
        type: String,
        default: 'USDT'
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    },
    hash: {
        type: String
    },
    method: {
        type: String,
        enum: ['AUTO', 'MANUAL'],
        default: 'MANUAL'
    },
    description: {
        type: String
    },
    adminNote: {
        type: String
    }
}, { timestamps: true });

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;
