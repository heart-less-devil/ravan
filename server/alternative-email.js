const nodemailer = require('nodemailer');
require('dotenv').config();

// Alternative email configuration using Gmail with different settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'universalx0242@gmail.com',
    pass: process.env.EMAIL_PASS || 'nxyh whmt krdk ayqb'
  },
  debug: true, // Enable debug output
  logger: true // Log information to the console
});

async function testAlternativeEmail() {
  try {
    console.log('🔧 Testing Alternative Gmail Configuration...');
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'universalx0242@gmail.com',
      to: process.env.EMAIL_USER || 'universalx0242@gmail.com',
      subject: 'BioPing - Alternative Email Test',
      text: 'This is a test email using alternative Gmail configuration.',
      html: '<h2>BioPing Email Test</h2><p>Alternative configuration test.</p>'
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Alternative email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Alternative email test failed:', error);
    console.log('\n💡 Next Steps:');
    console.log('1. Generate a new App Password from Google Account');
    console.log('2. Make sure 2-Factor Authentication is enabled');
    console.log('3. Try using OAuth2 instead of App Password');
  }
}

testAlternativeEmail(); 