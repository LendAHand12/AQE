import mongoose from 'mongoose';

const adminLogSchema = mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    adminUsername: {
        type: String,
        required: true
    },
    action: {
        type: String, // e.g., 'UPDATE_USER', 'DELETE_USER', 'UPDATE_TOKEN_SETTINGS'
        required: true
    },
    target: {
        type: String, // the ID or name of the target entity
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed, // Stores old/new values
        default: {}
    },
    ipAddress: {
        type: String
    }
}, {
    timestamps: true
});

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
export default AdminLog;
