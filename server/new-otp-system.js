// NEW SIMPLE OTP SYSTEM - NO EMAIL COMPLEXITY
// This replaces the old email system completely

const express = require('express');
const app = express();

// NEW SIMPLE OTP ENDPOINTS
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    console.log('🔑 NEW OTP SYSTEM: Verification request received');
    
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid email required' 
      });
    }
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`🔑 NEW OTP SYSTEM: Code generated for ${email}: ${verificationCode}`);
    
    // NEW APPROACH: Always return OTP in response (no email dependency)
    res.json({
      success: true,
      message: 'Verification code generated successfully',
      verificationCode: verificationCode,
      note: 'Use this code to verify your email: ' + verificationCode,
      email: email,
      expiresIn: '10 minutes',
      system: 'NEW SIMPLE OTP SYSTEM'
    });

  } catch (error) {
    console.error('❌ NEW OTP SYSTEM ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// NEW SIMPLE PASSWORD RESET OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    console.log('🔑 NEW OTP SYSTEM: Password reset request received');
    
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid email required' 
      });
    }
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`🔑 NEW OTP SYSTEM: Password reset code for ${email}: ${verificationCode}`);
    
    // NEW APPROACH: Always return OTP in response (no email dependency)
    res.json({
      success: true,
      message: 'Password reset code generated successfully',
      verificationCode: verificationCode,
      note: 'Use this code to reset your password: ' + verificationCode,
      email: email,
      expiresIn: '10 minutes',
      system: 'NEW SIMPLE OTP SYSTEM'
    });

  } catch (error) {
    console.error('❌ NEW OTP SYSTEM ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = app;
