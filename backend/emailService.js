const nodemailer = require('nodemailer');

// Setup email transporter
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 6000,
    });
    return transporter;
  }

  // Fallback: try Ethereal with a 3-second timeout, else fallback to simulated logger
  try {
    const testAccountPromise = nodemailer.createTestAccount();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Ethereal testAccount timed out')), 3000)
    );
    const testAccount = await Promise.race([testAccountPromise, timeoutPromise]);

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 6000,
    });
    console.log('📧 Ethereal test mailer initialized for LocalService:', testAccount.user);
  } catch (err) {
    console.warn('⚠️ Could not connect to external mailer, using simulated fallback:', err.message);
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('\n================== SIMULATED CONFIRMATION EMAIL ==================');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Content:\n${mailOptions.text}`);
        console.log('==================================================================\n');
        return { messageId: 'simulated-' + Date.now() };
      },
    };
  }

  return transporter;
};

/**
 * Send email verification link to newly registered user
 */
const sendVerificationEmail = async (email, name, token) => {
  try {
    const mailClient = await Promise.race([
      getTransporter(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Email transporter initialization timed out')), 4000))
    ]);

    const appUrl = process.env.APP_URL || 'https://localservicesystem.onrender.com';
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"LocalService System" <noreply@localservice.com>',
      to: email,
      subject: 'Verify Your Email - Local Service Management System',
      text: `Hello ${name},\n\nThank you for signing up with LocalService! Please verify your email address to activate your account:\n\n${verifyUrl}\n\nVerification Token: ${token}\n\nIf you did not create this account, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; padding: 32px; border-radius: 16px; border: 1px solid #27272a;">
          <h2 style="color: #ffffff; margin-bottom: 8px;">Welcome to LocalService, ${name}!</h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
            Thank you for registering. To ensure the security of our platform and access your dashboard, please confirm your email address.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 10px; display: inline-block;">
              Verify Email Address
            </a>
          </div>

          <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br/>
            <a href="${verifyUrl}" style="color: #818cf8; word-break: break-all;">${verifyUrl}</a>
          </p>

          <div style="margin-top: 24px; padding: 12px; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px;">
            <span style="color: #a1a1aa; font-size: 11px;">Verification Token Code:</span>
            <div style="font-family: monospace; color: #e4e4e7; font-size: 13px; font-weight: bold; margin-top: 4px;">${token}</div>
          </div>

          <p style="color: #52525b; font-size: 11px; margin-top: 24px; border-top: 1px solid #27272a; padding-top: 16px;">
            If you did not sign up for LocalService, please ignore this email.
          </p>
        </div>
      `,
    };

    const sendPromise = mailClient.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP sendMail timed out')), 6000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✉️ Verification email dispatched to ${email}. Message ID: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl && info && !info.messageId?.startsWith('simulated-')) {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log(`🔗 Preview Email: ${preview}`);
    }
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Failed to dispatch verification email:', err.message);
    throw err;
  }
};

module.exports = {
  sendVerificationEmail,
};
