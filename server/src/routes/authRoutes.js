import express from 'express';
import { registerUser, loginUser, confirmEmail, getUserProfile, updateUserProfile, updateFaceTecStatus, setup2FA, submitIdVerification, getReferrals } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/confirm/:token', confirmEmail);
router.get('/validate-referral/:username', (req, res, next) => {
    // We'll implement this in the controller, but first add the import
    import('../controllers/authController.js').then(m => m.validateReferral(req, res)).catch(next);
});
router.get('/referrals', protect, getReferrals);
router.post('/kyc-status', protect, updateFaceTecStatus);
router.post('/setup-2fa', protect, setup2FA);
router.post('/verify-id', protect, submitIdVerification);

// User Profile Routes
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Upload route
router.post('/upload', protect, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    });
});

export default router;
