const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔧 Testing Gmail Email Configuration...');
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'universalx0242@gmail.com',
    pass: process.env.EMAIL_PASS || 'gtph fetm lwtu ezyv'
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
});

// Test email configuration
async function testEmail() {
  try {
    console.log('🔍 Verifying email configuration...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    
    // Send test email
    const testEmail = process.env.EMAIL_USER || 'universalx0242@gmail.com';
    console.log(`📧 Sending test email to: ${testEmail}`);
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'universalx0242@gmail.com',
      to: testEmail,
      subject: 'BioPing - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">BioPing Email Test</h2>
          <p>This is a test email to verify that Gmail configuration is working correctly.</p>
          <p>If you receive this email, your email setup is working!</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Make sure 2-Factor Authentication is enabled');
    console.log('2. Generate a new App Password from Google Account settings');
    console.log('3. Update the EMAIL_PASS in your .env file');
    console.log('4. Check if "Less secure app access" is enabled (if using old method)');
  }
}

testEmail(); 