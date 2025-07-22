const nodemailer = require('nodemailer');
require('dotenv').config();

// Test email configuration
const testEmail = async () => {
  console.log('🧪 Testing Email Configuration...\n');

  // Check environment variables
  console.log('📧 Email Configuration:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ Email configuration incomplete!');
    console.log('Please update server/.env file with your Gmail credentials.');
    console.log('See EMAIL_SETUP.md for detailed instructions.');
    return;
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Test email template
  const emailTemplate = {
    subject: 'Test Email - BioPing',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Email Test</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Email Configuration Test</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            This is a test email to verify your email configuration is working correctly.
          </p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">123456</span>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            If you received this email, your configuration is working!
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Best regards,<br>
              The BioPing Team
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    console.log('📤 Sending test email...');
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('To:', mailOptions.to);
    console.log('\n📧 Check your email inbox for the test message.');
    console.log('\n🎉 Email configuration is working!');
    console.log('You can now use signup with real OTP emails.');
    
  } catch (error) {
    console.log('❌ Email test failed!');
    console.log('Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Gmail credentials in .env file');
    console.log('2. Make sure 2FA is enabled on your Gmail');
    console.log('3. Use App Password, not regular password');
    console.log('4. Check EMAIL_SETUP.md for detailed instructions');
  }
};

// Run test
testEmail(); 