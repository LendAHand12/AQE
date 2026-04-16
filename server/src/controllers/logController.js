import AdminLog from '../models/AdminLog.js';

// @desc    Get Admin Logs
export const getAdminLogs = async (req, res) => {
    try {
        const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
