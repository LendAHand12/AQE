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

export const sendConfirmationEmail = async (email, token, firstName) => {
    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm/${token}`;

    const mailOptions = {
        from: `AQ Estate Support <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Xác nhận đăng ký tài khoản AQ Estate',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 8px;">
                <h2 style="color: #276152;">Chào mừng ${firstName} đến với AQ Estate!</h2>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng nhấn vào nút bên dưới để xác nhận email của bạn:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmationUrl}" style="background-color: #276152; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Xác nhận tài khoản</a>
                </div>
                <p>Nếu nút trên không hoạt động, bạn có thể copy và dán liên kết này vào trình duyệt:</p>
                <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${confirmationUrl}</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9ca3af;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Không thể gửi email xác nhận. Vui lòng thử lại sau.');
    }
};
