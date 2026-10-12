import Transaction from '../models/Transaction.js';
import { sendSecurityAlertEmail } from './emailService.js';

// Clients that are clearly not a browser running our web app
const TOOL_UA = /postman|insomnia|curl|httpie|python-requests|python-urllib|aiohttp|node-fetch|undici|got\/|axios\/|go-http-client|okhttp|java\/|libwww|wget|scrapy/i;

const toOrigin = (value) => {
    try {
        return new URL(value.trim()).origin;
    } catch {
        return null;
    }
};

const allowedOrigins = () => {
    const raw = [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGINS].filter(Boolean).join(',');
    return new Set(raw.split(',').map(toOrigin).filter(Boolean));
};

export const isValidTxHash = (hash) => typeof hash === 'string' && /^0x[0-9a-fA-F]{64}$/.test(hash);

/**
 * Best-effort checks for payment confirmations that did not come from our web app.
 * Headers can be forged, so this detects careless abuse (Postman/curl/scripts), not a determined attacker.
 */
export const detectSuspiciousPayment = async (req, transaction, hash) => {
    const reasons = [];

    const ua = req.get('user-agent') || '';
    if (!ua) reasons.push('Missing User-Agent');
    else if (TOOL_UA.test(ua)) reasons.push(`API tool User-Agent: ${ua}`);

    const origin = req.get('origin');
    const allowed = allowedOrigins();
    if (!origin) {
        reasons.push('Missing Origin header (browsers always send it on POST)');
    } else if (allowed.size && !allowed.has(toOrigin(origin))) {
        reasons.push(`Origin not allowed: ${origin}`);
    }

    if (!req.get('sec-fetch-site') || !req.get('sec-fetch-mode')) {
        reasons.push('Missing Sec-Fetch-* headers (not a browser request)');
    }

    if (typeof hash === 'string') {
        if (!isValidTxHash(hash)) {
            reasons.push(`Malformed transaction hash (${hash.length} chars)`);
        } else {
            // Same hash with something added/changed at one end (e.g. original + "x") reused on another order
            const h = hash.toLowerCase();
            const near = await Transaction.findOne({
                _id: { $ne: transaction._id },
                hash: { $exists: true, $ne: null },
                $or: [
                    { hash: { $regex: `^${h.slice(0, 40)}` } },
                    { hash: { $regex: `${h.slice(-40)}$` } }
                ]
            }).select('paymentId hash');
            if (near && near.hash !== h) {
                reasons.push(`Hash is almost identical to existing hash ${near.hash} (payment #${near.paymentId})`);
            }
        }
    }

    // Wallet signing + block confirmation takes real time; instant confirmation means the call was scripted
    if (transaction?.createdAt && Date.now() - new Date(transaction.createdAt).getTime() < 15000) {
        reasons.push('Payment confirmed less than 15s after the order was created');
    }

    return reasons;
};

export const alertSuspiciousPayment = async (req, user, transaction, hash, reasons, action) => {
    await sendSecurityAlertEmail('Suspicious payment confirmation', [
        ['Action', action],
        ['User', `${user?.fullName || ''} (@${user?.username || ''}) ${user?.email || ''}`],
        ['User ID', String(user?._id || '')],
        ['Payment ID', String(transaction?.paymentId || '')],
        ['Amount', `${transaction?.amount} ${transaction?.symbol || ''}`],
        ['Submitted hash', String(hash ?? '')],
        ['Reasons', reasons.join('\n')],
        ['IP', req.ip],
        ['User-Agent', req.get('user-agent') || ''],
        ['Origin', req.get('origin') || ''],
        ['Time', new Date().toISOString()]
    ]);
};
