const nodemailer = require('nodemailer');
require('dotenv').config();

// Temporary solution using a different email service
// You can use services like SendGrid, Mailgun, or even a different Gmail account

console.log('🔧 Setting up temporary email solution...');

// Option 1: Use a different Gmail account
const tempTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'universalx0242@gmail.com', // Replace with a different Gmail
    pass: 'nxyh whmt krdk ayqb'     // Replace with app password
  }
});

// Option 2: Use SendGrid (if you have an account)
// const tempTransporter = nodemailer.createTransport({
//   host: 'smtp.sendgrid.net',
//   port: 587,
//   auth: {
//     user: 'apikey',
//     pass: 'your-sendgrid-api-key'
//   }
// });

async function testTempEmail() {
  try {
    console.log('📧 Testing temporary email solution...');
    
    const mailOptions = {
      from: 'your-other-gmail@gmail.com', // Replace with your email
      to: 'universalx0242@gmail.com',
      subject: 'BioPing - Temporary Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">BioPing Email Test</h2>
          <p>This is a test email using temporary email configuration.</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      `
    };
    
    const result = await tempTransporter.sendMail(mailOptions);
    console.log('✅ Temporary email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Temporary email test failed:', error);
    console.log('\n💡 Solutions:');
    console.log('1. Use a different Gmail account');
    console.log('2. Use SendGrid or Mailgun service');
    console.log('3. Generate a new App Password for current Gmail');
    console.log('4. Enable "Less secure app access" (not recommended)');
  }
}

// Uncomment the line below to test
// testTempEmail(); 