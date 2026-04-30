import mongoose from 'mongoose';

const balanceHistorySchema = mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    symbol: { 
        type: String, 
        required: true 
    }, // AQE, HEWE, etc.
    type: { 
        type: String, 
        enum: ['RECEIVE', 'SWAP', 'REWARD', 'WITHDRAW', 'TRANSFER', 'BUY_ASSET', "COMMISSION"], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['SUCCESS', 'PENDING', 'FAILED'], 
        default: 'SUCCESS' 
    },
    balanceBefore: { type: Number },
    balanceAfter: { type: Number },
    description: { type: String },
    isOfficial: { type: Boolean, default: false },
}, { timestamps: true });

const BalanceHistory = mongoose.model('BalanceHistory', balanceHistorySchema);

export default BalanceHistory;
