import Admin from '../models/Admin.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import { generateToken } from '../utils/jwt.js';

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
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
export const updateUserByAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
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
        const user = await User.findById(req.params.id);
        if (user) {
            const userEmail = user.email;
            await User.findByIdAndDelete(req.params.id);

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

