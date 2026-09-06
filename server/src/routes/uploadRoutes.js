import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adminProtect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép tải lên hình ảnh!'));
        }
    }
});

const router = express.Router();

// @desc    Upload an image
// @route   POST /api/upload
// @access  Admin
router.post('/', adminProtect, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl, message: 'Upload thành công' });
});

export default router;
