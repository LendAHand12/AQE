import mongoose from 'mongoose';

const commissionSchema = mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amountUsdt: {
        type: Number,
        required: true
    },
    level: {
        type: Number,
        enum: [1, 2],
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    salesAmount: {
        type: Number,
        required: true
    },
    // PENDING: the buyer (fromUserId) has not completed FaceTec yet, so the amount is NOT in the recipient's balance.
    // CLAIMED: credited to recipient's usdtBalance. Default is CLAIMED so commissions created before this field existed stay paid.
    status: {
        type: String,
        enum: ['PENDING', 'CLAIMED'],
        default: 'CLAIMED'
    },
    claimedAt: {
        type: Date,
        default: null
    },
}, {
    timestamps: true
});

const Commission = mongoose.model('Commission', commissionSchema);
export default Commission;
