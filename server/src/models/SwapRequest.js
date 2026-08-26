import mongoose from 'mongoose';

const swapRequestSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        default: '+84'
    },
    email: {
        type: String,
        required: true
    },
    idCode: {
        type: String,
        required: true
    },
    outputToken: {
        type: String,
        enum: ['QHEWE', 'AQE'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    rateAtRequest: {
        type: Number,
        default: 1
    },
    fromWalletAddress: {
        type: String
    },
    txHash: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'AWAITING_WALLET', 'AWAITING_TRANSFER', 'COMPLETED', 'REJECTED'],
        default: 'PENDING'
    },
    quantumWalletAddress: {
        type: String,
        default: null
    },
    walletSubmitToken: {
        type: String,
        default: null
    },
    walletSubmittedAt: {
        type: Date,
        default: null
    },
    adminNote: {
        type: String
    },
    completionTxHash: {
        type: String
    },
    sentAmount: {
        type: Number
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    processedAt: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    }
}, {
    timestamps: true
});

const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);
export default SwapRequest;
