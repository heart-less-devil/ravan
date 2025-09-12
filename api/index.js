const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Email configuration
let transporter;

// Check if using custom domain email or Gmail
const isCustomDomain = (process.env.EMAIL_USER || '').includes('@thebioping.com');

if (isCustomDomain) {
  // Custom domain email configuration
  transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'mail.bioping.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || 'info@bioping.com',
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  console.log('📧 API using custom domain email:', process.env.EMAIL_USER);
} else {
  // Gmail configuration
  transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'universalx0242@gmail.com',
      pass: process.env.EMAIL_PASS || 'nxyh whmt krdk ayqb'
    }
  });
  console.log('📧 API using Gmail email:', process.env.EMAIL_USER);
}

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Email configuration error:', error);
    console.log('🔧 Please check your Gmail app password');
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Email templates
const emailTemplates = {
  passwordReset: (code) => ({
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
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${code}</span>
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
  })
};

// In-memory storage (replace with database in production)
let biotechData = [];
let users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@bioping.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin'
  }
];

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Admin endpoints
app.post('/api/admin/upload-excel', authenticateToken, multer().single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log('Uploaded data:', data.length, 'records');
    console.log('Sample record:', data[0]);

    biotechData = data;

    res.json({ 
      message: 'Data uploaded successfully', 
      count: data.length,
      sample: data[0]
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }

    // Check if user exists
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'No account found with this email address' 
      });
    }
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`🔑 PASSWORD RESET CODE FOR ${email}: ${verificationCode}`);
    
    // Send email with verification code
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'universalx0242@gmail.com',
        to: email,
        ...emailTemplates.passwordReset(verificationCode)
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email} with code: ${verificationCode}`);

      res.json({
        success: true,
        message: 'Password reset code sent successfully to your email'
      });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      console.log(`📧 Email failed to send, but code is: ${verificationCode}`);
      
      // Return success with the code in response for development
      res.json({
        success: true,
        message: 'Password reset code generated (email failed to send)',
        verificationCode: verificationCode, // Include code in response
        emailError: 'Email service temporarily unavailable'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, code, and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Find the user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // In a real application, you would verify the code from a database
    // For now, we'll accept any 6-digit code for testing
    if (code.length !== 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code' 
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password
    user.password = hashedPassword;

    console.log(`✅ Password reset successful for ${email}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search endpoint
app.post('/api/search-biotech', authenticateToken, (req, res) => {
  try {
    const {
      drugName,
      contactName,
      diseaseArea,
      lookingFor,
      stage,
      modality,
      region,
      function: functionType
    } = req.body;

    console.log('Search criteria:', req.body);

    if (!diseaseArea || !lookingFor) {
      return res.status(400).json({ error: 'Disease Area and Looking For are required' });
    }

    let filteredData = biotechData.filter(record => {
      // Mandatory filters
      const diseaseMatch = record['Disease Area'] && 
        record['Disease Area'].toLowerCase().includes(diseaseArea.toLowerCase());
      
      const lookingForMatch = record['Looking For'] && 
        record['Looking For'].toLowerCase().includes(lookingFor.toLowerCase());

      if (!diseaseMatch || !lookingForMatch) {
        return false;
      }

      // Optional filters
      if (drugName && record['Drug Name'] && 
          !record['Drug Name'].toLowerCase().includes(drugName.toLowerCase())) {
        return false;
      }

      if (contactName && record['Contact Name'] && 
          !record['Contact Name'].toLowerCase().includes(contactName.toLowerCase())) {
        return false;
      }

      if (stage && record['Stage of Development'] && 
          !record['Stage of Development'].toLowerCase().includes(stage.toLowerCase())) {
        return false;
      }

      if (modality && record['Modality'] && 
          !record['Modality'].toLowerCase().includes(modality.toLowerCase())) {
        return false;
      }

      if (region && record['Region'] && 
          !record['Region'].toLowerCase().includes(region.toLowerCase())) {
        return false;
      }

      if (functionType && functionType !== 'All') {
        const isBD = record['Function'] && record['Function'].toLowerCase().includes('business development');
        if (functionType === 'Business Development' && !isBD) return false;
        if (functionType === 'Non-BD' && isBD) return false;
      }

      return true;
    });

    console.log('Filtered results:', filteredData.length);

    res.json({
      results: filteredData,
      total: filteredData.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get contacts endpoint
app.post('/api/get-contacts', authenticateToken, (req, res) => {
  try {
    const { companyId } = req.body;
    
    // Find company data
    const company = biotechData.find(record => record.id === companyId);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      contacts: [{
        name: company['Contact Name'] || 'N/A',
        email: company['Email'] || 'N/A',
        phone: company['Phone'] || 'N/A',
        title: company['Title'] || 'N/A'
      }]
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

// Pricing analytics endpoints
app.get('/api/pricing-analytics', authenticateToken, (req, res) => {
  // Mock data for pricing analytics
  res.json({
    totalRevenue: 125000,
    monthlyGrowth: 15,
    topPlans: [
      { name: 'Pro Plan', revenue: 45000, growth: 12 },
      { name: 'Enterprise', revenue: 35000, growth: 8 },
      { name: 'Basic', revenue: 20000, growth: 5 }
    ]
  });
});

// Export function for Vercel
module.exports = app; 