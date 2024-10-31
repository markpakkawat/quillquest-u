// testEmail.js
require('dotenv').config(); // Loads environment variables
const sendEmail = require('./utils/sendEmail'); // Adjust path as necessary

(async () => {
  try {
    await sendEmail({
      to: 'recipient@gmail.com', // Replace with your email for testing
      subject: 'Test Email',
      text: 'This is a test email from Nodemailer using Gmail SMTP',
    });
    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Error sending test email:', error);
  }
})();

// you can test sending email by access backend folder
// edit recipient to your email and then type node testEmail.js
