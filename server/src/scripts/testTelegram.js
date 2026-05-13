import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendTelegramNotification } from '../utils/telegramService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const testTele = async () => {
    console.log('--- Testing Telegram Notification ---');
    console.log('BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'Loaded' : 'NOT FOUND');
    console.log('CHAT_ID:', process.env.TELEGRAM_ADMIN_CHAT_ID || 'NOT FOUND');
    
    const message = `
🔔 <b>Test Notification</b>
━━━━━━━━━━━━━━━━━━━━━━━━
This is a test message from <b>AQ Estate</b> system.
Time: ${new Date().toLocaleString()}
Status: 🟢 Working
━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    console.log('Sending message...');
    await sendTelegramNotification(message);
    console.log('Done.');
};

testTele();
