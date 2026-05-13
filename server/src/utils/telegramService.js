import axios from 'axios';

/**
 * Send a notification to a Telegram group/admin
 * @param {string} message - The message to send
 */
export const sendTelegramNotification = async (message) => {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

        if (!botToken || !chatId) {
            console.warn('[TelegramService] TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured');
            return;
        }

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });
        
        console.log('[TelegramService] Notification sent successfully');
    } catch (error) {
        const errorData = error.response?.data;
        if (errorData?.description === 'Bad Request: chat not found') {
            console.error('[TelegramService] Lỗi: Không tìm thấy Chat ID. Vui lòng kiểm tra xem Bot đã được thêm vào Nhóm và Nhóm có ID chính xác trong .env chưa.');
        } else {
            console.error('[TelegramService] Error sending notification:', errorData || error.message);
        }
    }
};
