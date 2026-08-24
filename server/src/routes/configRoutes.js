import express from 'express';
import { getSystemConfig } from '../utils/configHelper.js';

const router = express.Router();

/**
 * @route   GET /api/config/exchange-rate
 * @desc    Public endpoint — trả về tỷ giá AQE/USDT để client sử dụng
 * @access  Public
 */
router.get('/exchange-rate', async (req, res) => {
    try {
        const config = await getSystemConfig();
        res.json({
            aqeToUsdtRate: config.aqeToUsdtRate,
            heweToQhewRate: config.heweToQhewRate,
            heweToAqeRate: config.heweToAqeRate,
        });
    } catch (error) {
        console.error('[PublicConfig] Error:', error);
        // Fallback giá trị mặc định nếu DB lỗi
        res.json({ aqeToUsdtRate: 1.02, heweToQhewRate: 1, heweToAqeRate: 1 });
    }
});

export default router;
