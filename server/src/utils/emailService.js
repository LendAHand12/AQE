import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendConfirmationEmail = async (email, token, fullName) => {
    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm/${token}`;

    const mailOptions = {
        from: `AQ Estate Support <${process.env.EMAIL_FROM}>`,
        to: email,
        cc: process.env.SUPPORT_EMAIL,
        subject: 'Confirm your AQ Estate Account Registration',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #276152;">Welcome to AQ Estate, ${fullName}!</h2>
                <p>Thank you for registering with us. To complete your registration and activate your account, please click the button below to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmationUrl}" style="background-color: #276152; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirm Account</a>
                </div>
                <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${confirmationUrl}</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9ca3af;">If you did not make this request, please ignore this email.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Could not send confirmation email. Please try again later.');
    }
};

export const sendResetPasswordEmail = async (email, token, fullName) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const mailOptions = {
        from: `AQ Estate Support <${process.env.EMAIL_FROM}>`,
        to: email,
        cc: process.env.SUPPORT_EMAIL,
        subject: 'Reset your AQ Estate Account Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #276152;">Hello ${fullName},</h2>
                <p>We received a request to reset your password for your AQ Estate account. Please click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #276152; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p>This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
                <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9ca3af;">AQ Estate Security Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reset password email sent to ${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Could not send reset password email. Please try again later.');
    }
};

export const sendTicketCreatedEmailToAdmin = async (ticket, userEmail, fullName) => {
    const adminUrl = `${process.env.FRONTEND_URL}/admin/tickets/${ticket._id}`;

    const mailOptions = {
        from: `AQ Estate System <${process.env.EMAIL_FROM}>`,
        to: process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM, // Gửi tới admin/support
        subject: `[NEW TICKET] ${ticket.subject}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #276152;">New Support Ticket Created</h2>
                <p><strong>User:</strong> ${fullName} (${userEmail})</p>
                <p><strong>Subject:</strong> ${ticket.subject}</p>
                <p><strong>Message:</strong></p>
                <div style="padding: 15px; border-left: 4px solid #f3f4f6; background: #f9fafb; margin-bottom: 20px;">
                    ${ticket.message}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${adminUrl}" style="background-color: #276152; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in Admin Panel</a>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Ticket creation email sent to admin for ticket ${ticket._id}`);
    } catch (error) {
        console.error('Error sending ticket admin email:', error);
    }
};

export const sendTicketRepliedEmailToUser = async (email, ticketSubject, adminResponse, ticketId) => {
    const ticketUrl = `${process.env.FRONTEND_URL}/tickets/${ticketId}`;

    const mailOptions = {
        from: `AQ Estate Support <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `[SUPPORT UPDATE] Your ticket has been replied`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #276152;">Update on your Support Ticket</h2>
                <p><strong>Subject:</strong> ${ticketSubject}</p>
                <p>Our support team has responded to your ticket:</p>
                <div style="padding: 15px; border-left: 4px solid #276152; background: #f0fdf4; margin-bottom: 20px;">
                    ${adminResponse}
                </div>
                <p>You can view the full details of your ticket by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${ticketUrl}" style="background-color: #276152; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Ticket</a>
                </div>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9ca3af;">AQ Estate Support Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Ticket reply email sent to user ${email}`);
    } catch (error) {
        console.error('Error sending ticket reply email:', error);
    }
};

export const sendUserRepliedEmailToAdmin = async (userEmail, userFullName, subject, userMessage, ticketId) => {
    const adminEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM; 
    
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #276152;">New Reply on Ticket: #${ticketId}</h2>
            <p>User <strong>${userFullName}</strong> (${userEmail}) has replied to the ticket: <strong>${subject}</strong></p>
            <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #276152; margin: 20px 0;">
                <p style="margin: 0; white-space: pre-wrap;">${userMessage}</p>
            </div>
            <p>Please log in to the admin panel to respond.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `AQ Estate System <${process.env.EMAIL_FROM}>`,
            to: adminEmail,
            subject: `[AQ Estate] User Replied: ${subject}`,
            html: htmlContent
        });
        console.log(`User reply email sent to admin for ticket ${ticketId}`);
    } catch (error) {
        console.error('Error sending user reply admin email:', error);
    }
};
