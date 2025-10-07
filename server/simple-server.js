// SIMPLE SERVER - NO EMAIL COMPLEXITY
// This is a clean rebuild of the OTP system

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple data storage
const mockDB = {
  users: [],
  verificationCodes: []
};

// NEW SIMPLE OTP SYSTEM - NO EMAIL DEPENDENCY
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    console.log('🔑 NEW SIMPLE OTP: Verification request received');
    
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid email required' 
      });
    }
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code
    mockDB.verificationCodes.push({
      email,
      code: verificationCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    
    console.log(`🔑 NEW SIMPLE OTP: Code generated for ${email}: ${verificationCode}`);
    
    // ALWAYS RETURN OTP IN RESPONSE - NO EMAIL DEPENDENCY
    res.json({
      success: true,
      message: 'Verification code generated successfully',
      verificationCode: verificationCode,
      note: 'Use this code to verify your email: ' + verificationCode,
      email: email,
      expiresIn: '10 minutes',
      system: 'NEW SIMPLE OTP SYSTEM - NO EMAIL COMPLEXITY'
    });

  } catch (error) {
    console.error('❌ NEW SIMPLE OTP ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// NEW SIMPLE PASSWORD RESET OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    console.log('🔑 NEW SIMPLE OTP: Password reset request received');
    
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid email required' 
      });
    }
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code
    mockDB.verificationCodes.push({
      email,
      code: verificationCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      type: 'password-reset'
    });
    
    console.log(`🔑 NEW SIMPLE OTP: Password reset code for ${email}: ${verificationCode}`);
    
    // ALWAYS RETURN OTP IN RESPONSE - NO EMAIL DEPENDENCY
    res.json({
      success: true,
      message: 'Password reset code generated successfully',
      verificationCode: verificationCode,
      note: 'Use this code to reset your password: ' + verificationCode,
      email: email,
      expiresIn: '10 minutes',
      system: 'NEW SIMPLE OTP SYSTEM - NO EMAIL COMPLEXITY'
    });

  } catch (error) {
    console.error('❌ NEW SIMPLE OTP ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    system: 'NEW SIMPLE OTP SYSTEM - NO EMAIL COMPLEXITY',
    otpSystem: 'Working without email dependency'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 NEW SIMPLE OTP SERVER STARTED');
  console.log(`📡 Server running on port ${PORT}`);
  console.log('🔑 OTP System: Simple and reliable (no email complexity)');
  console.log('✅ Ready to handle OTP requests');
});

module.exports = app;
