const nodemailer = require('nodemailer');

// Test OTP email sending
async function testOTP() {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'gauravvij1980@gmail.com',
        pass: 'keux xtjd bzat vnzj'
      }
    });

    const mailOptions = {
      from: 'gauravvij1980@gmail.com',
      to: 'gauravvij1980@gmail.com',
      subject: 'BioPing - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Email Verification</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Your Verification Code</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thank you for signing up with BioPing! Please use the verification code below to complete your registration:
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">123456</span>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP test successful:', result.messageId);
    console.log('📧 Email sent from:', mailOptions.from);
    console.log('📧 Email sent to:', mailOptions.to);
    
  } catch (error) {
    console.log('❌ OTP test failed:', error.message);
  }
}

testOTP();
