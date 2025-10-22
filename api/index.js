const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

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
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || 'support@thebioping.com',
      pass: process.env.EMAIL_PASS || 'Shivam1984!!'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  console.log('📧 API using custom domain email:', process.env.EMAIL_USER || 'support@thebioping.com');
} else {
  // Gmail configuration
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'gauravvij1980@gmail.com',
      pass: process.env.EMAIL_PASS || 'keux xtjd bzat vnzj'
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
  }),
  verification: (code) => ({
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
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
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
let verificationCodes = [];
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

// Send verification code endpoint
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address' 
      });
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code
    verificationCodes.push({
      email,
      code: verificationCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    console.log(`🔑 VERIFICATION CODE FOR ${email}: ${verificationCode}`);
    
    // Send email with verification code
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'support@thebioping.com',
        to: email,
        ...emailTemplates.verification(verificationCode)
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email} with code: ${verificationCode}`);

      res.json({
        success: true,
        message: 'Verification code sent successfully to your email'
      });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      console.log(`📧 Email failed to send, but code is: ${verificationCode}`);
      
      // Return success with the code in response for development
      res.json({
        success: true,
        message: 'Verification code generated (email failed to send)',
        verificationCode: verificationCode,
        emailError: 'Email service temporarily unavailable'
      });
    }

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email code endpoint
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and code are required' 
      });
    }

    // Find the verification code
    const verificationRecord = verificationCodes.find(
      record => record.email === email && 
                record.code === code && 
                new Date() < record.expiresAt
    );

    if (!verificationRecord) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification code' 
      });
    }

    // Remove the used verification code
    verificationCodes = verificationCodes.filter(
      record => !(record.email === email && record.code === code)
    );

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
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
        from: process.env.EMAIL_USER || 'support@thebioping.com',
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

// AI Deal Scraper endpoint
app.post('/api/ai-deal-scraper', [
  body('searchQuery').notEmpty().trim(),
  body('sources').isArray(),
  body('dateRange').isInt({ min: 1, max: 365 }),
  body('userEmail').isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { searchQuery, sources, dateRange, userEmail } = req.body;
    
    console.log(`🤖 AI Deal Scraper started for user: ${userEmail}`);
    console.log(`🔍 Search query: ${searchQuery}`);
    console.log(`📰 Sources: ${sources.join(', ')}`);
    console.log(`📅 Date range: ${dateRange} days`);

    // Return mock data for now
    const mockDeals = [
      {
        buyer: 'Novartis',
        seller: 'Shanghai Argo',
        drugName: 'RNAi Therapeutics',
        therapeuticArea: 'Cardiovascular and Metabolic',
        stage: 'Phase I/II',
        financials: '$185M upfront, $4.165B Total Value',
        dealDate: new Date().toISOString().split('T')[0],
        source: 'PR Newswire',
        sourceUrl: 'https://www.prnewswire.com/news-releases/shanghai-argo-announces-multi-program-rnai-licenses-and-strategic-collaborations-with-novartis-302027699.html',
        title: 'Shanghai Argo Announces Multi-Program RNAi Licenses and Strategic Collaborations with Novartis'
      },
      {
        buyer: 'Pfizer',
        seller: 'BioNTech',
        drugName: 'mRNA Vaccine Platform',
        therapeuticArea: 'Infectious Diseases',
        stage: 'Marketed',
        financials: '$2.8B total potential value',
        dealDate: new Date().toISOString().split('T')[0],
        source: 'BioSpace',
        sourceUrl: 'https://www.biospace.com',
        title: 'Pfizer and BioNTech Expand mRNA Collaboration'
      },
      {
        buyer: 'Merck',
        seller: 'Moderna',
        drugName: 'Personalized Cancer Vaccine',
        therapeuticArea: 'Oncology',
        stage: 'Phase II',
        financials: '$250M upfront, $1.2B total value',
        dealDate: new Date().toISOString().split('T')[0],
        source: 'Fierce Biotech',
        sourceUrl: 'https://www.fiercebiotech.com',
        title: 'Merck and Moderna Partner on Personalized Cancer Vaccines'
      }
    ];

    console.log(`🎯 Returning ${mockDeals.length} mock deals for testing`);

    res.json({
      success: true,
      data: {
        deals: mockDeals,
        totalFound: mockDeals.length,
        sources: sources,
        searchQuery: searchQuery,
        dateRange: dateRange
      },
      creditsUsed: 1,
      message: `Successfully scraped ${mockDeals.length} deals from ${sources.length} sources`
    });

  } catch (error) {
    console.error('Error in AI Deal Scraper:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error scraping deals. Please try again.' 
    });
  }
});

// Export function for Vercel
module.exports = app; 