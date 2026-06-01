import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const testEmail = async () => {
    console.log('--- Testing Email Notification ---');
    console.log('SMTP Host:', process.env.EMAIL_HOST);
    console.log('SMTP User:', process.env.EMAIL_USER);
    
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `AQ Estate Support <${process.env.EMAIL_FROM}>`,
        to: 'letrananhkiet1010@gmail.com',
        subject: '🚀 Test Email from AQ Estate System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #276152;">AQ Estate System Test</h2>
                <p>This is a test email to verify that the SMTP configuration is working correctly on your server.</p>
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p><strong>Status:</strong> 🟢 Connected</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString('vi-VN', { timeZone: 'America/Chicago' })}</p>
                    <p><strong>Server:</strong> AWS EC2 Production</p>
                </div>
                <p>If you received this email, it means your SMTP settings are correct.</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9ca3af;">AQ Estate Technical Team</p>
            </div>
        `,
    };

    console.log('Sending test email to: letrananhkiet1010@gmail.com ...');
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        if (error.code === 'EAUTH') {
            console.error('Auth Error: Please check your EMAIL_USER and EMAIL_PASS.');
        }
    }
    console.log('Done.');
};

testEmail();
