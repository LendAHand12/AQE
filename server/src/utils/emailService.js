import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "mail01.123host.vn",
    port: 465,
    secure: true,
    auth: {
        user: "support@dreamchain.live",
        pass: "84230fGm2",
    },
});

export const sendConfirmationEmail = async (email, token, fullName) => {
    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm/${token}`;

    const mailOptions = {
        from: `AQ Estate Support <${process.env.EMAIL_FROM}>`,
        to: email,
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
