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
}, {
    timestamps: true
});

const Commission = mongoose.model('Commission', commissionSchema);
export default Commission;
