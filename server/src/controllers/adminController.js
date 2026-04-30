import Admin from '../models/Admin.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import Notification from '../models/Notification.js';
import Transaction from '../models/Transaction.js';
import Property from '../models/Property.js';
import { generateToken } from '../utils/jwt.js';
import { emitNotification } from '../utils/socket.js';
import { generateTwoFactorSecret, verifyTwoFactorCode } from '../utils/twoFactor.js';

// @desc    Auth admin & get token
// @route   POST /api/admin/login
export const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });

        if (admin && (await admin.matchPassword(password))) {
            if (admin.isTwoFactorEnabled) {
                return res.json({ requires2FA: true, id: admin._id });
            }

            res.json({
                _id: admin._id,
                username: admin.username,
                role: admin.role,
                token: generateToken(admin._id),
            });
        } else {
            res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify 2FA for admin login
export const verify2FALogin = async (req, res) => {
    try {
        const { id, code } = req.body;
        const admin = await Admin.findById(id);

        if (!admin) {
            return res.status(401).json({ message: 'Tài khoản không tồn tại' });
        }

        const isVerified = verifyTwoFactorCode(admin.twoFactorSecret, code);

        if (isVerified) {
            res.json({
                _id: admin._id,
                username: admin.username,
                role: admin.role,
                token: generateToken(admin._id),
            });
        } else {
            res.status(400).json({ message: 'Mã xác thực không đúng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Helper function to create Vietnamese accent-insensitive regex
        const createVietnameseRegex = (str) => {
            const map = {
                'a': '[aàáảãạăằắẳẵặâầấẩẫậ]',
                'e': '[eèéẻẽẹêềếểễệ]',
                'i': '[iìíỉĩị]',
                'o': '[oòóỏõọôồốổỗộơờớởỡợ]',
                'u': '[uùúủũụưừứửữự]',
                'y': '[yỳýỷỹỵ]',
                'd': '[dđ]',
                'A': '[AÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]',
                'E': '[EÈÉẺẼẸÊỀẾỂỄỆ]',
                'I': '[IÌÍỈĨỊ]',
                'O': '[OÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]',
                'U': '[UÙÚỦŨỤƯỪỨỬỮỰ]',
                'Y': '[YỲÝỶỸỴ]',
                'D': '[DĐ]'
            };
            let regexStr = str;
            Object.keys(map).forEach(key => {
                regexStr = regexStr.replace(new RegExp(key, 'g'), map[key]);
            });
            return new RegExp(regexStr, 'i');
        };

        const queryRegex = search ? createVietnameseRegex(search) : null;
        const statusFilter = req.query.status;

        const query = { 
            isDeleted: false,
            ...(statusFilter === 'active' && { isActive: true }),
            ...(statusFilter === 'inactive' && { isActive: false }),
            ...(queryRegex && {
                $or: [
                    { fullName: { $regex: queryRegex } },
                    { email: { $regex: queryRegex } },
                    { username: { $regex: queryRegex } }
                ]
            })
        };


        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            users,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user stats
// @route   GET /api/admin/users/stats
export const getUserStats = async (req, res) => {
    try {
        const total = await User.countDocuments({ isDeleted: false });
        const verified = await User.countDocuments({ isDeleted: false, kycStatus: 'verified' });
        const pending = await User.countDocuments({ isDeleted: false, kycStatus: 'pending' });
        const locked = await User.countDocuments({ isDeleted: false, isActive: false });

        res.json({
            total,
            verified,
            pending,
            locked
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Update user
// @route   PUT /api/admin/users/:id
export const updateUserByAdmin = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, isDeleted: false });
        if (user) {
            // Check for email uniqueness if changing
            if (req.body.email && req.body.email !== user.email) {
                const emailExists = await User.findOne({ email: req.body.email, isDeleted: false });
                if (emailExists) return res.status(400).json({ message: 'auth.errors.email_exists' });
                user.email = req.body.email;
            }

            // Check for phone uniqueness if changing
            if (req.body.phone && req.body.phone !== user.phone) {
                const phoneExists = await User.findOne({ phone: req.body.phone, isDeleted: false });
                if (phoneExists) return res.status(400).json({ message: 'auth.errors.phone_exists' });
                user.phone = req.body.phone;
            }

            user.fullName = req.body.fullName ?? user.fullName;
            user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
            user.birthday = req.body.birthday ?? user.birthday;
            user.gender = req.body.gender ?? user.gender;
            user.telegram = req.body.telegram ?? user.telegram;
            user.address = req.body.address ?? user.address;
            user.nation = req.body.nation ?? user.nation;
            user.walletAddress = req.body.walletAddress ?? user.walletAddress;

            // Create notification if KYC status changed
            if (req.body.kycStatus && req.body.kycStatus !== user.kycStatus) {
                const kycType = req.body.kycStatus === 'verified' ? 'KYC_APPROVED' : 'KYC_REJECTED';
                const title = req.body.kycStatus === 'verified' ? 'KYC Approved' : 'KYC Rejected';
                const message = req.body.kycStatus === 'verified' 
                    ? 'Congratulations! Your identity verification has been approved.' 
                    : 'Your identity verification was rejected. Please check your documents and try again.';

                const notification = await Notification.create({
                    userId: user._id,
                    title,
                    message,
                    type: kycType,
                    isRead: false
                });

                // Emit real-time notification
                emitNotification(user._id, notification);
            }

            user.kycStatus = req.body.kycStatus || user.kycStatus;
            
            const updatedUser = await user.save();

            // Log the action
            await AdminLog.create({
                adminId: req.admin._id,
                adminUsername: req.admin.username,
                action: 'UPDATE_USER',
                target: user.email,
                details: { userId: user._id, changes: req.body }
            });

            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, isDeleted: false });
        if (user) {
            const userEmail = user.email;
            
            // Soft delete: set isDeleted to true
            user.isDeleted = true;
            await user.save();

            // Log the action
            await AdminLog.create({
                adminId: req.admin._id,
                adminUsername: req.admin.username,
                action: 'DELETE_USER',
                target: userEmail,
                details: { userId: req.params.id }
            });

            res.json({ message: 'Người dùng đã được xóa thành công. Email này hiện có thể đăng ký lại.' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate 2FA Secret
export const generate2FA = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);
        const { secret, qrCodeUrl } = await generateTwoFactorSecret(admin.username);
        
        admin.twoFactorSecret = secret;
        await admin.save();

        res.json({ secret, qrCodeUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Enable 2FA
export const enable2FA = async (req, res) => {
    try {
        const { code } = req.body;
        const admin = await Admin.findById(req.admin._id);

        const isVerified = verifyTwoFactorCode(admin.twoFactorSecret, code);

        if (isVerified) {
            admin.isTwoFactorEnabled = true;
            await admin.save();
            res.json({ message: '2FA enabled successfully', isTwoFactorEnabled: true });
        } else {
            res.status(400).json({ message: 'Mã xác thực không đúng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Disable 2FA
export const disable2FA = async (req, res) => {
    try {
        const { code } = req.body;
        const admin = await Admin.findById(req.admin._id);

        const isVerified = verifyTwoFactorCode(admin.twoFactorSecret, code);

        if (isVerified) {
            admin.isTwoFactorEnabled = false;
            // admin.twoFactorSecret = null;
            await admin.save();
            res.json({ message: '2FA disabled successfully', isTwoFactorEnabled: false });
        } else {
            res.status(400).json({ message: 'Mã xác thực không đúng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard-stats
export const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Basic stats
        const totalUsers = await User.countDocuments({ isDeleted: false });
        const activeAssets = await Property.countDocuments({ status: { $in: ['funding', 'completed'] }, isDeleted: false });
        const todayTransactions = await Transaction.countDocuments({ createdAt: { $gte: startOfDay } });
        
        // Total Revenue (Successful PAYMENT transactions in USDT)
        const revenueResult = await Transaction.aggregate([
            { $match: { type: 'PAYMENT', status: 'SUCCESS', symbol: 'USDT' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Monthly Revenue for Chart (Last 12 months)
        const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
        const monthlyRevenue = await Transaction.aggregate([
            { $match: { type: 'PAYMENT', status: 'SUCCESS', symbol: 'USDT', createdAt: { $gte: twelveMonthsAgo } } },
            { 
                $group: { 
                    _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, 
                    total: { $sum: '$amount' } 
                } 
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Recent Transactions (Only user payments)
        const recentTransactionsRaw = await Transaction.find({ type: 'PAYMENT', status: 'SUCCESS' })
            .sort({ createdAt: -1 })
            .limit(5);

        // Fetch user names for transactions
        const recentTransactions = await Promise.all(recentTransactionsRaw.map(async (tx) => {
            const user = await User.findById(tx.from).select('fullName email');
            return {
                ...tx.toObject(),
                userName: user ? user.fullName || user.email : tx.from
            };
        }));

        // Pending KYC
        const pendingKYC = await User.find({ kycStatus: 'pending', isDeleted: false })
            .select('fullName email createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        // Helpers for Comparison
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);

        // 1. Users Growth (New users this month vs last month)
        const newUsersThisMonth = await User.countDocuments({ isDeleted: false, createdAt: { $gte: startOfMonth } });
        const newUsersLastMonth = await User.countDocuments({ isDeleted: false, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } });
        const userChange = calculateChange(newUsersThisMonth, newUsersLastMonth);

        // 2. Assets Growth
        const newAssetsThisMonth = await Property.countDocuments({ isDeleted: false, createdAt: { $gte: startOfMonth } });
        const newAssetsLastMonth = await Property.countDocuments({ isDeleted: false, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } });
        const assetChange = calculateChange(newAssetsThisMonth, newAssetsLastMonth);

        // 3. Transactions (Today vs Yesterday)
        const yesterdayTransactionsCount = await Transaction.countDocuments({ createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } });
        const txChange = calculateChange(todayTransactions, yesterdayTransactionsCount);

        // 4. Revenue (This month vs Last month)
        const revenueThisMonthRes = await Transaction.aggregate([
            { $match: { type: 'PAYMENT', status: 'SUCCESS', symbol: 'USDT', createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const revenueLastMonthRes = await Transaction.aggregate([
            { $match: { type: 'PAYMENT', status: 'SUCCESS', symbol: 'USDT', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const revThisMonth = revenueThisMonthRes.length > 0 ? revenueThisMonthRes[0].total : 0;
        const revLastMonth = revenueLastMonthRes.length > 0 ? revenueLastMonthRes[0].total : 0;
        const revChange = calculateChange(revThisMonth, revLastMonth);

        res.json({
            stats: {
                totalUsers: { value: totalUsers, change: userChange },
                activeAssets: { value: activeAssets, change: assetChange },
                todayTransactions: { value: todayTransactions, change: txChange },
                totalRevenue: { value: totalRevenue, change: revChange }
            },
            monthlyRevenue,
            recentTransactions,
            pendingKYC
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat(((current - previous) / previous * 100).toFixed(1));
};
