import mongoose from 'mongoose';

/**
 * Config model — lưu các cấu hình hệ thống do admin quản lý.
 * Mỗi document là một cấu hình riêng biệt (key-value-label).
 *
 * Các key mặc định:
 *  - aqeToUsdtRate         : Tỷ giá 1 AQE = X USDT
 *  - withdrawalFee         : Phí rút USDT (USDT)
 *  - minWithdrawal         : Số tiền rút tối thiểu (USDT)
 *  - minTotalPaidForWithdrawal : Tổng đã nạp tối thiểu để được phép rút
 */
const configSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Config = mongoose.model('Config', configSchema);
export default Config;
