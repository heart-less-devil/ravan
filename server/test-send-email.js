const nodemailer = require('nodemailer');

console.log('🧪 Testing Actual Email Sending...\n');

// Use the working Gmail configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'gauravvij1980@gmail.com',
    pass: 'keux xtjd bzat vnzj'
  }
});

async function testSendEmail() {
  try {
    console.log('📧 Sending test email to universalx0242@gmail.com...');
    
    const mailOptions = {
      from: 'gauravvij1980@gmail.com',
      to: 'amankk0007@gmail.com',
      subject: 'BioPing - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Password Reset</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Your Password Reset Code</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              You requested a password reset for your BioPing account. Please use the verification code below to reset your password:
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">123456</span>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes. If you didn't request this password reset, please ignore this email.
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
    
    const startTime = Date.now();
    const result = await transporter.sendMail(mailOptions);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('⏱️ Time taken:', duration + 'ms');
    console.log('📧 Response:', result.response);
    
    if (duration > 20000) {
      console.log('⚠️ Warning: Email took more than 20 seconds to send');
    }
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('🔍 Full error:', error);
  }
}

testSendEmail();
