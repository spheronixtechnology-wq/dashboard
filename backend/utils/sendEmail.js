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
      console.error("❌ Email Send Failed:", error.message);

      if (error.code === 'EAUTH') {
          console.error("💡 TIP: If using Gmail, make sure you are using an App Password, not your login password.");
          console.error("   Generate one at: https://myaccount.google.com/apppasswords");
      }

      // FALLBACK FOR DEVELOPMENT: Log the OTP/Message so testing can continue
      // This allows the user to see the OTP in the console if SMTP fails
      if (process.env.NODE_ENV === 'development') {
          console.log("\n==================================================");
          console.log("⚠️  DEVELOPMENT MODE - EMAIL MOCK  ⚠️");
          console.log(`TO: ${options.email}`);
          console.log(`SUBJECT: ${options.subject}`);
          console.log(`MESSAGE:\n${options.message}`);
          console.log("==================================================\n");
          
          // Write OTP to file for automation scripts
          const otpMatch = options.message.match(/(\d{6})/);
          if (otpMatch) {
              const fs = require('fs');
              const path = require('path');
              // Use absolute path relative to the project root or backend folder
              const otpPath = path.resolve(__dirname, '..', 'otp.tmp');
              fs.writeFileSync(otpPath, otpMatch[1]);
              console.log(`[TEST DEBUG] OTP Written to ${otpPath}`);
          }

          return; // Do not throw, treat as success
      }

      throw new Error("Email could not be sent due to provider error");
  }
};

module.exports = sendEmail;
