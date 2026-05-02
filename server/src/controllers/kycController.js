import User from '../models/User.js';
import jwt from 'jsonwebtoken';

/**
 * @desc    Start FaceTec KYC Enrollment
 * @route   POST /api/kyc/start-face-scan
 * @access  Private
 */
export const startFaceScan = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Create a secure callback token
        const callbackToken = jwt.sign(
            { userId }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        const frontendUrl = process.env.FRONTEND_URL;
        const callbackUrl = `${frontendUrl}/user/kyc-callback?token=${callbackToken}`;
        
        // FaceTec Enrollment URL (enroll.html)
        // Usually, this would be a hosted page on the FaceTec server or your own server
        const facetecBaseUrl = process.env.FACETEC_BASE_URL;
        const enrollmentUrl = `${facetecBaseUrl}/enroll.html?callback=${encodeURIComponent(callbackUrl)}&user_id=${userId}`;

        res.json({
            success: true,
            url: enrollmentUrl
        });
    } catch (error) {
        console.error('Start Face Scan Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Complete FaceTec KYC Enrollment (Callback verification)
 * @route   POST /api/kyc/complete-face-scan
 * @access  Private
 */
export const completeFaceScan = async (req, res) => {
    const { token, facetecTid, ageEstimate, status } = req.body;

    try {
        // 1. Verify token
        if (!token) {
            return res.status(400).json({ message: 'Thiếu token xác thực' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        if (userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Token không hợp lệ cho người dùng này' });
        }

        if (status !== 'success') {
            return res.status(400).json({ message: 'FaceTec enrollment failed or was cancelled' });
        }

        // 2. Update User Database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        user.faceTecTid = facetecTid;
        user.ageEstimate = ageEstimate;
        // Optionally update kycStatus if business logic requires it here
        // user.kycStatus = 'pending'; 
        
        await user.save();

        res.json({
            success: true,
            message: 'Đăng ký khuôn mặt thành công',
            user: {
                fullName: user.fullName,
                kycStatus: user.kycStatus
            }
        });

    } catch (error) {
        console.error('Complete Face Scan Error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }
        res.status(500).json({ message: error.message });
    }
};
