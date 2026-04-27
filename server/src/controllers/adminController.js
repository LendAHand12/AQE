import Admin from '../models/Admin.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import Notification from '../models/Notification.js';
import { generateToken } from '../utils/jwt.js';
import { emitNotification } from '../utils/socket.js';

// @desc    Auth admin & get token
// @route   POST /api/admin/login
export const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });

        if (admin && (await admin.matchPassword(password))) {
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

        const query = { 
            isDeleted: false,
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

