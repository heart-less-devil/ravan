const nodemailer = require('nodemailer');

// Test simple OTP sending
async function testOTP() {
  console.log('🧪 Testing OTP functionality...');
  
  // Create simple Gmail transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'gauravvij1980@gmail.com',
      pass: 'keux xtjd bzat vnzj'
    }
  });

  // Generate test OTP
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`🔑 Generated OTP: ${verificationCode}`);

  // Test email sending
  try {
    const mailOptions = {
      from: 'gauravvij1980@gmail.com',
      to: 'gauravvij1980@gmail.com', // Send to self for testing
      subject: 'BioPing - Test OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>OTP Test</h1>
          <p>Your test OTP code is:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${verificationCode}</span>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully!');
    console.log('📧 Check your Gmail inbox for the test email');
    
  } catch (error) {
    console.error('❌ OTP email failed:', error.message);
  }
}

// Run the test
testOTP();
