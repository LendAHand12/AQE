import Config from '../models/Config.js';

// Cache ngắn ~30 giây để tránh query DB liên tục
let _cache = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 30_000;

/**
 * Trả về toàn bộ config dưới dạng object { key: value }
 * Ví dụ: { aqeToUsdtRate: 1.02, withdrawalFee: 1.0, ... }
 */
export const getSystemConfig = async () => {
    const now = Date.now();
    if (_cache && now - _cacheAt < CACHE_TTL_MS) {
        return _cache;
    }

    const docs = await Config.find({});
    const map = {};
    for (const doc of docs) {
        map[doc.key] = doc.value;
    }

    // Đảm bảo luôn có giá trị fallback nếu chưa seed
    const defaults = getDefaultConfig();
    const merged = { ...defaults, ...map };

    _cache = merged;
    _cacheAt = now;
    return merged;
};

/**
 * Trả về giá trị của 1 key cụ thể
 * @param {string} key
 */
export const getConfigValue = async (key) => {
    const config = await getSystemConfig();
    return config[key];
};

/**
 * Invalidate cache (gọi sau khi admin cập nhật config)
 */
export const invalidateConfigCache = () => {
    _cache = null;
    _cacheAt = 0;
};

/**
 * Giá trị mặc định nếu DB chưa có document
 */
export const getDefaultConfig = () => ({
    aqeToUsdtRate: 1.02,
    heweToQhewRate: 1,
    heweToAqeRate: 1,
});
