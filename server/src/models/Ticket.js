import mongoose from 'mongoose';

const ticketSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        default: 'PENDING'
    },
    replies: [{
        sender: { type: String, enum: ['USER', 'ADMIN'], required: true },
        message: { type: String, required: true },
        images: [{ type: String }],
        createdAt: { type: Date, default: Date.now }
    }],
    adminResponse: {
        type: String,
        default: null
    },
    adminResponseAt: {
        type: Date,
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    }
}, {
    timestamps: true
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
