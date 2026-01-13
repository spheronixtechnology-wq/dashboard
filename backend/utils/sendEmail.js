const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter using Gmail SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Spheronix Technology" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${options.email}`);
  } catch (error) {
      console.error("❌ Email Send Failed:", error);
      throw new Error("Email could not be sent due to provider error");
  }
};

module.exports = sendEmail;
