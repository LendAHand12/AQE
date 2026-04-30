import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export const generateTwoFactorSecret = async (name) => {
    const secret = speakeasy.generateSecret({
        name: `AQ Estate (${name})`,
        issuer: 'AQ Estate'
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
        secret: secret.base32,
        qrCodeUrl
    };
};

export const verifyTwoFactorCode = (secret, token) => {
    // For testing: generate and log the correct code
    // const currentCode = speakeasy.totp({
    //     secret,
    //     encoding: 'base32'
    // });
    // console.log(`[TESTING] Correct 2FA Code for this secret: ${currentCode}`);

    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1 // Allow 1 step before/after (30 seconds window)
    });
};
