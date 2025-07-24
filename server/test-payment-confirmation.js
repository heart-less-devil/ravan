// Test Payment Confirmation Email
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'universalx0242@gmail.com',
    pass: 'nxyh whmt krdk ayqb'
  }
});

// Test payment confirmation email
async function testPaymentConfirmation() {
  try {
    const mailOptions = {
      from: 'universalx0242@gmail.com',
      to: 'universalx0242@gmail.com', // Test email
      subject: 'BioPing - Payment Confirmation Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Payment Confirmation Test</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Payment Successful!</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              This is a test email to verify payment confirmation is working.
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: bold;">Amount:</span>
                <span>$1.00 USD</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: bold;">Transaction ID:</span>
                <span style="font-family: monospace;">pi_test_123456789</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: bold;">Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If you received this email, payment confirmation is working correctly!
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
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Test payment confirmation email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
  }
}

// Run test
testPaymentConfirmation(); 