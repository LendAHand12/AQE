/**
 * Middleware to restrict admin routes to a list of whitelisted IPs.
 * IP check is bypassed in 'development' environment.
 */
export const ipWhitelistAdmin = (req, res, next) => {
    // 1. Skip IP whitelist check in development environment
    if (process.env.NODE_ENV === 'development') {
        return next();
    }

    // 2. Extract client IP
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    
    if (typeof clientIp === 'string') {
        // Handle comma-separated list if forwarded through multiple proxies
        if (clientIp.includes(',')) {
            clientIp = clientIp.split(',')[0].trim();
        }
        // Normalize IPv6-mapped IPv4 addresses (e.g. ::ffff:127.0.0.1)
        if (clientIp.startsWith('::ffff:')) {
            clientIp = clientIp.substring(7);
        }
        // Normalize IPv6 loopback
        if (clientIp === '::1') {
            clientIp = '127.0.0.1';
        }
    }

    // 3. Retrieve and parse whitelisted IPs
    const whitelistStr = process.env.ADMIN_IP_WHITELIST || '';
    const whitelist = whitelistStr.split(',').map(ip => ip.trim()).filter(Boolean);

    // 4. Compare client IP against whitelist
    if (!clientIp || !whitelist.includes(clientIp)) {
        console.warn(`Blocked unauthorized admin access attempt from IP: ${clientIp}`);
        return res.status(403).json({ 
            message: 'Access denied: Your IP address is not whitelisted for administrator access.' 
        });
    }

    next();
};
