const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
  // Create a transporter using Gmail SMTP server
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // `false` for TLS, `true` for SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define the email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;