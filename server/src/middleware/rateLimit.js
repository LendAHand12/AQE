// Small in-memory fixed-window limiter (keyed by user id, falling back to IP). Single-instance only.
export const rateLimit = ({ windowMs, max, message = 'Too many requests, please slow down' }) => {
    const hits = new Map();

    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    }, windowMs).unref();

    return (req, res, next) => {
        const key = String(req.user?._id || req.ip);
        const now = Date.now();
        let entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }
        entry.count++;
        if (entry.count > max) {
            res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
            return res.status(429).json({ message });
        }
        next();
    };
};
