const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const canSendEmail = () => {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
};

// Create transporter (only when credentials exist)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // App password for Gmail
    },
    tls: {
      rejectUnauthorized: false, // For development, set to true in production with proper certificates
    },
  });
};

let transporter = null;

if (canSendEmail()) {
  transporter = createTransporter();
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email service configuration error:', error);
    } else {
      console.log('✅ Email service is ready to send emails');
    }
  });
} else {
  console.warn('⚠️ Email is not configured (missing EMAIL_USER/EMAIL_PASSWORD). Contact API will fail until set.');
}

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} options.replyTo - Reply-to email address
 */
const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  try {
    if (!canSendEmail() || !transporter) {
      throw new Error('Email is not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Form Submission'}" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
      replyTo: replyTo || process.env.EMAIL_USER,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  transporter,
};

