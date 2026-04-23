import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');

            // Fetch user from DB and attach to request
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user || req.user.isDeleted) {
                return res.status(401).json({ message: 'Người dùng không tồn tại hoặc đã bị xóa' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Phiên làm việc hết hạn, vui lòng đăng nhập lại' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện hành động này' });
    }
};

const adminProtect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');

            // Fetch admin from DB
            req.admin = await Admin.findById(decoded.id).select('-password');

            if (!req.admin) {
                return res.status(401).json({ message: 'Tài khoản quản trị không tồn tại' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Phiên làm việc admin hết hạn' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Quyền admin yêu cầu đăng nhập' });
    }
};

export { protect, adminProtect };
