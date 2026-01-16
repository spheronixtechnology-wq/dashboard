import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const required = [
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_SECURE',
    'EMAIL_USER',
    'EMAIL_PASS',
    'EMAIL_FROM',
  ];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required email env var: ${key}`);
    }
  }

  const port = Number(process.env.EMAIL_PORT);
  if (!Number.isFinite(port)) {
    throw new Error('Invalid EMAIL_PORT');
  }

  const secure = String(process.env.EMAIL_SECURE).trim().toLowerCase() === 'true';

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
      console.error("Email Send Failed:", error.message);

      throw new Error("Email could not be sent due to provider error");
  }
};

export default sendEmail;
