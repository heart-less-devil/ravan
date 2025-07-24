const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import models
const User = require('./models/User');
const BDTracker = require('./models/BDTracker');

const app = express();
const PORT = process.env.PORT || 3005;

// Connect to MongoDB
connectDB();

// Initialize Stripe with fallback for development
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = require('stripe')(stripeSecretKey);

// Log Stripe configuration
console.log('🔧 Stripe configuration:');
console.log('  - Secret key available:', !!process.env.STRIPE_SECRET_KEY);
console.log('  - Using fallback key:', !process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3002',
    'http://localhost:3005',
    'https://687dc02000e0ca0008eb4b09--deft-paprenjak-1f5e98.netlify.app',
    'https://deft-paprenjak-1f5e98.netlify.app',
    'https://biopingweb.netlify.app',
    'https://*.netlify.app',
    'https://thebioping.com',
    'https://www.thebioping.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://thebioping.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'BioPing Backend',
    version: '1.0.0'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    endpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/signup',
      '/api/create-payment-intent',
      '/api/auth/subscription-status'
    ]
  });
});

// MongoDB connection test endpoint
app.get('/api/test-mongodb', async (req, res) => {
  try {
    console.log('🔧 Testing MongoDB connection...');
    
    // Test MongoDB connection
    const User = require('./models/User');
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    // Test creating a user
    const testUserData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'mongodb-test@example.com',
      password: 'test123',
      company: 'BioPing',
      role: 'other',
      paymentCompleted: false,
      currentPlan: 'free',
      currentCredits: 5
    };
    
    // Check if test user exists
    let existingTestUser = await User.findOne({ email: testUserData.email });
    if (existingTestUser) {
      await User.findByIdAndDelete(existingTestUser._id);
      console.log('🧹 Cleaned up existing test user');
    }
    
    // Create test user
    const newTestUser = new User(testUserData);
    await newTestUser.save();
    console.log('✅ Test user created in MongoDB');
    
    // Verify user was saved
    const savedUser = await User.findOne({ email: testUserData.email });
    if (savedUser) {
      console.log('✅ Test user verified in MongoDB');
      // Clean up
      await User.findByIdAndDelete(savedUser._id);
      console.log('🧹 Test user cleaned up');
      
      res.json({
        success: true,
        message: 'MongoDB connection test successful!',
        details: {
          connection: 'Connected',
          database: 'bioping',
          testUser: 'Created and verified',
          cleanup: 'Completed'
        }
      });
    } else {
      throw new Error('Test user not found after creation');
    }
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'MongoDB connection test failed',
      error: error.message
    });
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Email configuration with better Gmail setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'universalx0242@gmail.com',
    pass: process.env.EMAIL_PASS || ''
  }
});

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

// Universal emails that can login without signup
const universalEmails = [
  'universalx0242@gmail.com',
  'admin@bioping.com',
  'demo@bioping.com',
  'test@bioping.com',
  'user@bioping.com',
  'guest@bioping.com'
];

// Pre-hashed password for all universal emails
const hashedPassword = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // 'password'

// Simple user data for universal emails
const universalUsers = universalEmails.map((email, index) => ({
  id: `universal_${index + 1}`,
  email: email,
  password: hashedPassword,
  name: email.split('@')[0],
  role: email === 'universalx0242@gmail.com' ? 'admin' : 'user'
}));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Admin auth - Auth header:', authHeader);
  console.log('Admin auth - Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('Admin auth - No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Admin auth - Invalid token:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    console.log('Admin auth - User email:', user.email);
    
    // Check if user is admin (only universalx0242@gmail.com can be admin)
    if (user.email !== 'universalx0242@gmail.com') {
      console.log('Admin auth - Access denied for:', user.email);
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    console.log('Admin auth - Access granted for:', user.email);
    req.user = user;
    next();
  });
};

// Routes

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Test current user route
app.get('/api/test-user', authenticateToken, (req, res) => {
  res.json({ 
    message: 'User authenticated',
    user: req.user,
    isAdmin: req.user.email === 'universalx0242@gmail.com' || req.user.email === 'admin@bioping.com'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      server: 'BioPing Backend',
      port: PORT,
      mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      email: process.env.EMAIL_USER ? 'Configured' : 'Not configured'
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      server: 'BioPing Backend',
      port: PORT,
      mongodb: 'Error',
      email: process.env.EMAIL_USER ? 'Configured' : 'Not configured'
    });
  }
});

// Secure PDF serving endpoint with advanced security
app.get('/api/secure-pdf/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const pdfPath = path.join(__dirname, '../pdf', filename);
    
    // Check if file exists and is a PDF
    if (!fs.existsSync(pdfPath) || !filename.toLowerCase().endsWith('.pdf')) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // Verify user permissions (in production, check user role and access rights)
    if (!req.user) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Set advanced security headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Add custom security headers
    res.setHeader('X-PDF-Security', 'protected');
    res.setHeader('X-User-ID', req.user.email);
    res.setHeader('X-Access-Time', new Date().toISOString());
    
    // Stream the PDF with security logging
    const stream = fs.createReadStream(pdfPath);
    
    // Log access for security monitoring
    console.log(`PDF access: ${filename} by user ${req.user.email} at ${new Date().toISOString()}`);
    
    stream.on('error', (error) => {
      console.error('PDF stream error:', error);
      res.status(500).json({ error: 'Error streaming PDF' });
    });
    
    stream.pipe(res);
    
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Additional secure PDF endpoint for different access patterns
app.get('/api/secure-pdf-stream/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const pdfPath = path.join(__dirname, '../pdf', filename);
    
    // Check if file exists and is a PDF
    if (!fs.existsSync(pdfPath) || !filename.toLowerCase().endsWith('.pdf')) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // Get file stats for range requests
    const stats = fs.statSync(pdfPath);
    const fileSize = stats.size;
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(pdfPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-PDF-Security': 'protected'
      });
      
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-PDF-Security': 'protected'
      });
      
      fs.createReadStream(pdfPath).pipe(res);
    }
    
  } catch (error) {
    console.error('Error serving PDF stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test email configuration
app.get('/api/test-email', async (req, res) => {
  try {
    const testMailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: req.query.email || 'test@example.com',
      subject: 'Test Email - BioPing',
      html: emailTemplates.verification('123456')
    };

    const result = await transporter.sendMail(testMailOptions);
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      to: req.query.email || 'test@example.com'
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: `Test email failed: ${error.message}`,
      error: {
        code: error.code,
        command: error.command,
        response: error.response
      }
    });
  }
});

// Send verification code endpoint
app.post('/api/auth/send-verification', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email } = req.body;
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code (in production, this would be in a database)
    mockDB.verificationCodes.push({
      email,
      code: verificationCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Save data to files
    saveDataToFiles('verification_code_sent');

    // Send email with verification code
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: emailTemplates.verification(verificationCode).subject,
        html: emailTemplates.verification(verificationCode).html
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email} with code: ${verificationCode}`);

      res.json({
        success: true,
        message: 'Verification code sent successfully to your email'
      });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      console.log(`🔑 VERIFICATION CODE FOR ${email}: ${verificationCode}`);
      console.log(`📧 Email failed to send, but code is: ${verificationCode}`);
      
      // Return success with the code in response for development
      res.json({
        success: true,
        message: 'Verification code generated (email failed to send)',
        verificationCode: verificationCode, // Include code in response
        emailError: 'Email service temporarily unavailable'
      });
    }

    // Save data to files
    saveDataToFiles('verification_code_sent');

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email code endpoint
app.post('/api/auth/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, code } = req.body;
    
    // Find the verification code
    const verificationRecord = mockDB.verificationCodes.find(
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
    mockDB.verificationCodes = mockDB.verificationCodes.filter(
      record => !(record.email === email && record.code === code)
    );

    // Save data to files
    saveDataToFiles('email_verified');

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create account endpoint
app.post('/api/auth/create-account', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = mockDB.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: mockDB.users.length + 1,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      role: 'user',
      createdAt: new Date()
    };

    mockDB.users.push(newUser);

    // Save data to files
    saveDataToFiles('user_created');

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser.id,
        email: newUser.email, 
        name: newUser.name,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(`🔧 Login attempt for: ${email}`);

    // Check if it's a universal email
    const user = universalUsers.find(u => u.email === email);
    
    if (!user) {
      console.log('🔍 Checking MongoDB for registered user...');
      // Check if it's a registered user (try MongoDB first, then file-based)
      let registeredUser = null;
      try {
        registeredUser = await User.findOne({ email });
        console.log('✅ MongoDB query completed');
        if (registeredUser) {
          console.log(`✅ Found user in MongoDB: ${email}`);
        } else {
          console.log('⚠️ User not found in MongoDB, checking file storage...');
        }
      } catch (dbError) {
        console.log('❌ MongoDB not available, checking file-based storage...');
        console.log('MongoDB Error:', dbError.message);
        registeredUser = mockDB.users.find(u => u.email === email);
      }

      if (!registeredUser) {
        console.log('❌ User not found in any storage');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password for registered user
      const isValidPassword = await bcrypt.compare(password, registeredUser.password);
      if (!isValidPassword) {
        console.log('❌ Invalid password');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('✅ Password verified successfully');
      
      // Generate JWT token for registered user
      const token = jwt.sign(
        { 
          id: registeredUser._id || registeredUser.id,
          email: registeredUser.email, 
          name: registeredUser.name || `${registeredUser.firstName} ${registeredUser.lastName}`,
          role: registeredUser.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`🎉 Login successful for: ${email}`);

      res.json({
        message: 'Login successful',
        token,
        user: {
          email: registeredUser.email,
          name: registeredUser.name || `${registeredUser.firstName} ${registeredUser.lastName}`,
          role: registeredUser.role
        },
        credits: registeredUser.currentCredits || 5
      });
      
      // Save login data
      saveDataToFiles('user_login');
      return;
    }

    console.log('🔍 Universal user login...');
    // Check password for universal user
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for universal user');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Universal user password verified');

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email, 
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`🎉 Universal user login successful: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      },
      credits: 5 // Give 5 credits to all users
    });
    
    // Save universal user login data
    saveDataToFiles('universal_user_login');

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    // Find the user in the database
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get payment status from localStorage (this would normally come from database)
    // For now, we'll return the basic user info and let frontend handle payment status
    res.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        // Payment info will be handled by frontend localStorage
        hasPaymentInfo: true // Indicates user can have payment data
      }
    });
    
    // Save profile access data
    saveDataToFiles('profile_accessed');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard data routes
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    totalCompanies: 500,
    totalContacts: 2500,
    totalInvestors: 200,
    recentSearches: 15
  });
});

app.get('/api/dashboard/saved-searches', authenticateToken, (req, res) => {
  res.json({
    searches: []
  });
});

app.get('/api/dashboard/search', authenticateToken, (req, res) => {
  res.json({
    message: 'Search endpoint ready'
  });
});

app.get('/api/dashboard/resources/definitions', authenticateToken, (req, res) => {
  res.json({
    definitions: {
      diseaseArea: "Select the therapeutic area your drug is targeting (e.g., oncology, neurology, infectious disease).",
      developmentStage: "Indicate the current stage of your drug: Preclinical, Clinical (Phase I-III), or Marketed.",
      modality: "Specify the type of drug (e.g., small molecule, biologic, gene therapy, cell therapy)",
      partnerCategory: "Choose the type of partner you're targeting:",
      region: "Select the geographic region where you're seeking potential partners (e.g., North America, Europe, Asia)."
    }
  });
});

app.get('/api/dashboard/resources/coaching-tips', authenticateToken, (req, res) => {
  res.json({
    tips: []
  });
});

app.get('/api/dashboard/resources/free-content', authenticateToken, (req, res) => {
  res.json({
    content: [
      {
        title: "1:1 Business Development Consulting with Vik",
        description: "Book a one-hour personalized session to discuss strategy, partnerships, or specific BD challenges. Reach out to Vik at gvij@cdslifescigroup.com"
      },
      {
        title: "Deal Comparables by Therapeutic Area",
        description: "Access curated deal comps segmented by therapeutic area to benchmark and guide your partnering strategy."
      },
      {
        title: "BD & Strategy Templates",
        description: "Download ready-to-use templates for licensing, M&A, outreach, and strategic planning."
      },
      {
        title: "BD Conferences",
        description: "Ranked & Reviewed"
      }
    ]
  });
});

app.get('/api/dashboard/legal', authenticateToken, (req, res) => {
  res.json({
    disclaimer: [
      {
        title: "1. Information Only - No Guarantees",
        content: "The information in the database (contact details, affiliations) is for general informational and business development purposes only, and accuracy, completeness, timeliness, or usefulness is not guaranteed."
      },
      {
        title: "2. No Endorsement or Representation",
        content: "Inclusion of any individual or company does not constitute an endorsement or recommendation, and the platform does not represent or act on behalf of listed individuals or companies."
      },
      {
        title: "3. Use at Your Own Risk",
        content: "Users are solely responsible for how they use the information, including outreach, communication, and follow-up, and the platform is not responsible for the outcome of contact attempts or partnerships."
      },
      {
        title: "4. No Liability",
        content: "The platform shall not be held liable for any direct, indirect, incidental, or consequential damages arising from use of the database, including errors, omissions, inaccuracies, or actions taken based on the information."
      },
      {
        title: "5. Compliance",
        content: "By accessing and using the database, users agree to comply with applicable data privacy laws (such as GDPR, CAN-SPAM) and ethical outreach practices, with the user solely responsible for compliance."
      },
      {
        title: "6. Intellectual Property",
        content: "All content and materials on this platform are protected by intellectual property rights."
      }
    ]
  });
});

app.get('/api/dashboard/contact', authenticateToken, (req, res) => {
  res.json({
    email: "gauravvij1980@gmail.com",
    message: "Please contact us via email if you find any discrepancies."
  });
});

// Pricing Analytics Backend Routes

// In-memory data storage (in production, this would be a database)
let pricingData = {
  plans: [
    { 
      id: 1,
      name: 'Starter', 
      price: 99, 
      color: 'blue', 
      members: 456, 
      revenue: 45144,
      growth: 12.5,
      conversion: 8.2,
      avgLifetime: 14.2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    { 
      id: 2,
      name: 'Professional', 
      price: 199, 
      color: 'purple', 
      members: 623, 
      revenue: 123977,
      growth: 18.7,
      conversion: 12.4,
      avgLifetime: 22.8,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    { 
      id: 3,
      name: 'Enterprise', 
      price: 399, 
      color: 'green', 
      members: 168, 
      revenue: 67032,
      growth: 6.3,
      conversion: 3.1,
      avgLifetime: 45.6,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ],
  recentPurchases: [
    { 
      id: 1,
      name: 'John Smith', 
      company: 'TechCorp', 
      plan: 'Professional', 
      date: '2024-01-15', 
      amount: 199, 
      status: 'active',
      email: 'john.smith@techcorp.com',
      phone: '+1-555-0123',
      createdAt: new Date('2024-01-15')
    },
    { 
      id: 2,
      name: 'Sarah Johnson', 
      company: 'BioTech', 
      plan: 'Enterprise', 
      date: '2024-01-14', 
      amount: 399, 
      status: 'active',
      email: 'sarah.johnson@biotech.com',
      phone: '+1-555-0124',
      createdAt: new Date('2024-01-14')
    },
    { 
      id: 3,
      name: 'Mike Chen', 
      company: 'Pharma Inc', 
      plan: 'Starter', 
      date: '2024-01-13', 
      amount: 99, 
      status: 'active',
      email: 'mike.chen@pharma.com',
      phone: '+1-555-0125',
      createdAt: new Date('2024-01-13')
    },
    { 
      id: 4,
      name: 'Emily Davis', 
      company: 'Life Sciences', 
      plan: 'Professional', 
      date: '2024-01-12', 
      amount: 199, 
      status: 'active',
      email: 'emily.davis@lifesciences.com',
      phone: '+1-555-0126',
      createdAt: new Date('2024-01-12')
    },
    { 
      id: 5,
      name: 'David Wilson', 
      company: 'Research Labs', 
      plan: 'Enterprise', 
      date: '2024-01-11', 
      amount: 399, 
      status: 'active',
      email: 'david.wilson@researchlabs.com',
      phone: '+1-555-0127',
      createdAt: new Date('2024-01-11')
    }
  ],
  monthlyStats: [
    { 
      id: 1,
      month: 'Jan', 
      starter: 45, 
      professional: 62, 
      enterprise: 18, 
      total: 125,
      revenue: 12500,
      growth: 0,
      createdAt: new Date('2024-01-31')
    },
    { 
      id: 2,
      month: 'Feb', 
      starter: 52, 
      professional: 68, 
      enterprise: 22, 
      total: 142,
      revenue: 14200,
      growth: 13.6,
      createdAt: new Date('2024-02-29')
    },
    { 
      id: 3,
      month: 'Mar', 
      starter: 48, 
      professional: 71, 
      enterprise: 20, 
      total: 139,
      revenue: 13900,
      growth: -2.1,
      createdAt: new Date('2024-03-31')
    },
    { 
      id: 4,
      month: 'Apr', 
      starter: 55, 
      professional: 75, 
      enterprise: 25, 
      total: 155,
      revenue: 15500,
      growth: 11.5,
      createdAt: new Date('2024-04-30')
    },
    { 
      id: 5,
      month: 'May', 
      starter: 58, 
      professional: 78, 
      enterprise: 28, 
      total: 164,
      revenue: 16400,
      growth: 5.8,
      createdAt: new Date('2024-05-31')
    },
    { 
      id: 6,
      month: 'Jun', 
      starter: 62, 
      professional: 82, 
      enterprise: 30, 
      total: 174,
      revenue: 17400,
      growth: 6.1,
      createdAt: new Date('2024-06-30')
    }
  ],
  topCompanies: [
    { 
      id: 1,
      name: 'BioTech Solutions', 
      revenue: 2397, 
      members: 12, 
      plan: 'Professional',
      contactPerson: 'Dr. Sarah Johnson',
      email: 'sarah@biotechsolutions.com',
      phone: '+1-555-0101',
      website: 'https://biotechsolutions.com',
      createdAt: new Date('2024-01-01')
    },
    { 
      id: 2,
      name: 'Pharma Research', 
      revenue: 1995, 
      members: 5, 
      plan: 'Enterprise',
      contactPerson: 'Mike Chen',
      email: 'mike@pharmaresearch.com',
      phone: '+1-555-0102',
      website: 'https://pharmaresearch.com',
      createdAt: new Date('2024-01-02')
    },
    { 
      id: 3,
      name: 'Life Sciences Corp', 
      revenue: 1791, 
      members: 9, 
      plan: 'Professional',
      contactPerson: 'Emily Davis',
      email: 'emily@lifesciencescorp.com',
      phone: '+1-555-0103',
      website: 'https://lifesciencescorp.com',
      createdAt: new Date('2024-01-03')
    },
    { 
      id: 4,
      name: 'Medical Innovations', 
      revenue: 1596, 
      members: 8, 
      plan: 'Professional',
      contactPerson: 'David Wilson',
      email: 'david@medicalinnovations.com',
      phone: '+1-555-0104',
      website: 'https://medicalinnovations.com',
      createdAt: new Date('2024-01-04')
    },
    { 
      id: 5,
      name: 'Clinical Research Ltd', 
      revenue: 1398, 
      members: 7, 
      plan: 'Professional',
      contactPerson: 'Lisa Brown',
      email: 'lisa@clinicalresearch.com',
      phone: '+1-555-0105',
      website: 'https://clinicalresearch.com',
      createdAt: new Date('2024-01-05')
    }
  ]
};

// Get all pricing analytics data
app.get('/api/pricing-analytics', authenticateToken, (req, res) => {
  try {
    // Calculate summary statistics
    const totalMembers = pricingData.plans.reduce((sum, plan) => sum + plan.members, 0);
    const totalRevenue = pricingData.plans.reduce((sum, plan) => sum + plan.revenue, 0);
    const avgRevenuePerMember = totalMembers > 0 ? totalRevenue / totalMembers : 0;
    
    const summary = {
      totalMembers,
      totalRevenue,
      avgRevenuePerMember: Math.round(avgRevenuePerMember),
      conversionRate: 8.2, // Average conversion rate
      mostPopularPlan: pricingData.plans.reduce((max, plan) => 
        plan.members > max.members ? plan : max
      ).name
    };

    res.json({
      success: true,
      data: {
        plans: pricingData.plans,
        recentPurchases: pricingData.recentPurchases,
        monthlyStats: pricingData.monthlyStats,
        topCompanies: pricingData.topCompanies,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching pricing analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pricing analytics data' 
    });
  }
});

// Get specific plan details
app.get('/api/pricing-analytics/plans/:planId', authenticateToken, (req, res) => {
  try {
    const planId = parseInt(req.params.planId);
    const plan = pricingData.plans.find(p => p.id === planId);
    
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan not found' 
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error fetching plan details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching plan details' 
    });
  }
});

// Add new purchase
app.post('/api/pricing-analytics/purchases', authenticateToken, [
  body('name').notEmpty().trim(),
  body('company').notEmpty().trim(),
  body('plan').notEmpty().trim(),
  body('amount').isNumeric(),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().trim()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { name, company, plan, amount, email, phone } = req.body;
    
    const newPurchase = {
      id: pricingData.recentPurchases.length + 1,
      name,
      company,
      plan,
      amount: parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      email,
      phone: phone || '',
      createdAt: new Date()
    };

    pricingData.recentPurchases.unshift(newPurchase);

    // Update plan statistics
    const planToUpdate = pricingData.plans.find(p => p.name === plan);
    if (planToUpdate) {
      planToUpdate.members += 1;
      planToUpdate.revenue += parseFloat(amount);
      planToUpdate.updatedAt = new Date();
    }

    res.status(201).json({
      success: true,
      message: 'Purchase added successfully',
      data: newPurchase
    });
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding purchase' 
    });
  }
});

// Update plan statistics
app.put('/api/pricing-analytics/plans/:planId', authenticateToken, [
  body('members').optional().isNumeric(),
  body('revenue').optional().isNumeric(),
  body('growth').optional().isNumeric(),
  body('conversion').optional().isNumeric(),
  body('avgLifetime').optional().isNumeric()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const planId = parseInt(req.params.planId);
    const plan = pricingData.plans.find(p => p.id === planId);
    
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan not found' 
      });
    }

    // Update only provided fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        plan[key] = parseFloat(req.body[key]);
      }
    });
    
    plan.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating plan' 
    });
  }
});

// Get revenue trends
app.get('/api/pricing-analytics/revenue-trends', authenticateToken, (req, res) => {
  try {
    const trends = pricingData.monthlyStats.map(month => ({
      month: month.month,
      revenue: month.revenue,
      growth: month.growth
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching revenue trends' 
    });
  }
});

// Get analytics summary
app.get('/api/pricing-analytics/summary', authenticateToken, (req, res) => {
  try {
    const totalMembers = pricingData.plans.reduce((sum, plan) => sum + plan.members, 0);
    const totalRevenue = pricingData.plans.reduce((sum, plan) => sum + plan.revenue, 0);
    const avgRevenuePerMember = totalMembers > 0 ? totalRevenue / totalMembers : 0;
    
    const summary = {
      totalMembers,
      totalRevenue,
      avgRevenuePerMember: Math.round(avgRevenuePerMember),
      conversionRate: 8.2,
      mostPopularPlan: pricingData.plans.reduce((max, plan) => 
        plan.members > max.members ? plan : max
      ).name,
      totalPurchases: pricingData.recentPurchases.length,
      activePurchases: pricingData.recentPurchases.filter(p => p.status === 'active').length
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics summary' 
    });
  }
});

// Export analytics data
app.get('/api/pricing-analytics/export', authenticateToken, (req, res) => {
  try {
    const exportData = {
      plans: pricingData.plans,
      recentPurchases: pricingData.recentPurchases,
      monthlyStats: pricingData.monthlyStats,
      topCompanies: pricingData.topCompanies,
      exportDate: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=pricing-analytics.json');
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error exporting analytics data' 
    });
  }
});

// Admin Panel Backend Routes

// In-memory storage for biotech data (in production, this would be a database)
let biotechData = [];

// Get all biotech data (admin only)
app.get('/api/admin/biotech-data', authenticateAdmin, (req, res) => {
  try {
    console.log('Admin biotech data - Request received');
    console.log('Admin biotech data - Data count:', biotechData.length);

    res.json({
      success: true,
      data: biotechData,
      uploadedFiles: mockDB.uploadedFiles
    });
  } catch (error) {
    console.error('Error fetching biotech data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching biotech data' 
    });
  }
});

// Upload Excel file
app.post('/api/admin/upload-excel', authenticateAdmin, upload.single('file'), (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Excel file must have at least a header row and one data row'
      });
    }

    // Get headers (first row)
    const headers = jsonData[0].map(header => header ? header.toString().trim() : '');
    
    // Log all headers for debugging
    console.log('Excel headers found:', headers);
    console.log('Looking for specific columns:');
    console.log('Company:', headers.indexOf('Company'));
    console.log('Contact Name:', headers.indexOf('Contact Name'));
    console.log('TA1 - Oncology:', headers.indexOf('TA1 - Oncology'));
    console.log('Tier:', headers.indexOf('Tier'));
    console.log('All TA columns:');
    for (let i = 1; i <= 17; i++) {
      const taHeader = i <= 10 ? `TA${i}` : `T${i}`;
      console.log(`${taHeader}:`, headers.indexOf(`${taHeader} -`));
    }
    
    // Accept any Excel file structure - no validation restrictions
    console.log('Processing Excel file with columns:', headers);

    // Process data rows (skip header)
    const newData = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row.length === 0 || row.every(cell => !cell)) continue; // Skip empty rows
      
      // Create record based on your actual Excel structure from images
      const record = {
        id: biotechData.length + newData.length + 1,
        companyName: row[headers.indexOf('Company')] || 'Pfizer',
        contactPerson: row[headers.indexOf('Contact Name')] || 'Contact ' + (newData.length + 1),
        contactTitle: row[headers.indexOf('Contact Title')] || 'Sr. Director',
        contactFunction: row[headers.indexOf('Contact Function')] || 'Business Development',
        email: row[headers.indexOf('Contact Email')] || 'contact@company.com',
        region: row[headers.indexOf('Country (HQ)')] || 'USA',
        tier: row[headers.indexOf('Tier')] || 'Large Pharma',
        modality: row[headers.indexOf('Modality')] || 'SM, LM, CT, GT',
        partnerType: row[headers.indexOf('Partner Type')] || 'Buyer',
        // Add TA columns based on your Excel structure (TA1-TA17)
        ta1_oncology: row[headers.indexOf('TA1 - Oncology')] || '0',
        ta2_cardiovascular: row[headers.indexOf('TA2 - Cardiovascular')] || '0',
        ta3_neuroscience: row[headers.indexOf('TA3 - Neuroscience')] || '0',
        ta4_immunology_autoimmune: row[headers.indexOf('T4 - Immunology & Autoimmune')] || '0',
        ta5_infectious_diseases: row[headers.indexOf('T5 - Infectious Diseases')] || '0',
        ta6_respiratory: row[headers.indexOf('T6 - Respiratory')] || '0',
        ta7_endocrinology_metabolic: row[headers.indexOf('T7 - Endocrinology & Metabolic')] || '0',
        ta8_rare_orphan: row[headers.indexOf('T8 - Rare / Orphan')] || '0',
        ta9_hematology: row[headers.indexOf('T9 - Hematology')] || '0',
        ta10_gastroenterology: row[headers.indexOf('T10 - Gastroenterology')] || '0',
        ta11_dermatology: row[headers.indexOf('T11 - Dermatology')] || '0',
        ta12_ophthalmology: row[headers.indexOf('T12 - Ophthalmology')] || '0',
        ta13_kidney_renal: row[headers.indexOf('T13 - Kidney / Renal')] || '0',
        ta14_msk_disease: row[headers.indexOf('T14 - MSK Disease')] || '0',
        ta15_womens_health: row[headers.indexOf('T15 - Women\'s Health')] || '0',
        ta16_pain: row[headers.indexOf('T16 - Pain')] || '0',
        ta17_urology: row[headers.indexOf('T17 - Urology')] || '0',
        // Add BD Person TA Focus
        bdPersonTAFocus: row[headers.indexOf('BD Person TA Focus (Only for Business Development)')] || '',
        createdAt: new Date().toISOString().split('T')[0]
      };

      // Accept any record - no validation restrictions
      newData.push(record);
    }

    if (newData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records found in the Excel file'
      });
    }

    // Add to existing data
    biotechData = [...biotechData, ...newData];

    // Store file info in mockDB
    const fileInfo = {
      id: Date.now(),
      filename: req.file.originalname,
      uploadDate: new Date(),
      recordsAdded: newData.length,
      totalRecords: biotechData.length
    };
    mockDB.uploadedFiles.push(fileInfo);

    // Save data to files
    saveDataToFiles('user_created');

    res.status(201).json({
      success: true,
      message: `${newData.length} records uploaded successfully`,
      data: {
        totalRecords: biotechData.length,
        newRecords: newData.length,
        processedRows: jsonData.length - 1,
        validRecords: newData.length,
        fileInfo
      }
    });
  } catch (error) {
    console.error('Error uploading Excel file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing Excel file: ' + error.message 
    });
  }
});

// Search biotech data (public endpoint with limits)
app.post('/api/search-biotech', authenticateToken, [
  body('drugName').optional(),
  body('diseaseArea').optional(),
  body('developmentStage').optional(),
  body('modality').optional(),
  body('partnerType').optional(),
  body('region').optional(),
  body('function').optional(),
  body('searchType').optional(),
  body('searchQuery').optional()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { drugName, diseaseArea, developmentStage, modality, partnerType, region, function: contactFunction, searchType, searchQuery } = req.body;
    
    console.log('Search criteria:', { drugName, diseaseArea, developmentStage, modality, partnerType, region, contactFunction });
    console.log('Total data available:', biotechData.length);
    console.log('Sample data item:', biotechData[0]);
    
    // Debug: Show all available column names in the first data item
    if (biotechData.length > 0) {
      console.log('Available columns in data:', Object.keys(biotechData[0]));
      console.log('Sample data with all columns:', biotechData[0]);
      
      // Check if the specific columns we're looking for exist
      console.log('Checking for TA columns:');
      console.log('t4_immunology_autoimmune exists:', 't4_immunology_autoimmune' in biotechData[0]);
      console.log('tier exists:', 'tier' in biotechData[0]);
      console.log('t4_immunology_autoimmune value:', biotechData[0].t4_immunology_autoimmune);
      console.log('tier value:', biotechData[0].tier);
    }
    
    // Filter data based on search criteria
    let filteredData = biotechData;
    
    // Check if user provided any search criteria
    let hasSearchCriteria = false;
    let searchCriteria = [];
    
    // Handle simple search by company name or contact name
    if (searchType && searchQuery) {
      hasSearchCriteria = true;
      searchCriteria.push('Simple Search');
      console.log('Simple search:', { searchType, searchQuery });
      
      const query = searchQuery.toLowerCase().trim();
      let tempFilteredData = biotechData.filter(item => {
        if (searchType === 'Company Name') {
          // Partial match for company name (case insensitive) - so "pfizer" will find "Pfizer Inc"
          return item.companyName && item.companyName.toLowerCase().includes(query);
        } else if (searchType === 'Contact Name') {
          // Partial match for contact name (case insensitive)
          return item.contactPerson && item.contactPerson.toLowerCase().includes(query);
        }
        return false;
      });
      
      // Always return individual contacts, don't group by company
      filteredData = tempFilteredData;
      console.log('Individual contacts found:', filteredData.length);
      console.log('After simple search filter, records found:', filteredData.length);
    }
    
    // Disease Area - mandatory
    if (diseaseArea) {
      hasSearchCriteria = true;
      searchCriteria.push('Disease Area');
      console.log('Filtering by disease area:', diseaseArea);
      
      // Map disease area to actual columns in your data (TA1-TA3, T4-T17)
      let taColumn = '';
      switch(diseaseArea) {
        case 'TA1 - Oncology': taColumn = 'ta1_oncology'; break;
        case 'TA2 - Cardiovascular': taColumn = 'ta2_cardiovascular'; break;
        case 'TA3 - Neuroscience': taColumn = 'ta3_neuroscience'; break;
        case 'TA4 - Immunology & Autoimmune': taColumn = 'ta4_immunology_autoimmune'; break;
        case 'TA5 - Infectious Diseases': taColumn = 'ta5_infectious_diseases'; break;
        case 'TA6 - Respiratory': taColumn = 'ta6_respiratory'; break;
        case 'TA7 - Endocrinology & Metabolic': taColumn = 'ta7_endocrinology_metabolic'; break;
        case 'TA8 - Rare / Orphan': taColumn = 'ta8_rare_orphan'; break;
        case 'TA9 - Hematology': taColumn = 'ta9_hematology'; break;
        case 'TA10 - Gastroenterology': taColumn = 'ta10_gastroenterology'; break;
        case 'TA11 - Dermatology': taColumn = 'ta11_dermatology'; break;
        case 'TA12 - Ophthalmology': taColumn = 'ta12_ophthalmology'; break;
        case 'TA13 - Kidney / Renal': taColumn = 'ta13_kidney_renal'; break;
        case 'TA14 - MSK Disease': taColumn = 'ta14_msk_disease'; break;
        case 'TA15 - Women\'s Health': taColumn = 'ta15_womens_health'; break;
        case 'TA16 - Pain': taColumn = 'ta16_pain'; break;
        case 'TA17 - Urology': taColumn = 'ta17_urology'; break;
        default: taColumn = ''; break;
      }
      
      if (taColumn) {
        console.log('Filtering by TA column:', taColumn);
        console.log('Checking if column exists in data:', taColumn in (biotechData[0] || {}));
        filteredData = biotechData.filter(item => {
          const taValue = item[taColumn];
          console.log('Checking:', item.companyName, 'TA Value:', taValue, 'Type:', typeof taValue, 'Column exists:', taColumn in item);
          return taValue === '1' || taValue === 1;
        });
        console.log('After disease area filter, records found:', filteredData.length);
      } else {
        console.log('Disease area not found in available options, skipping filter');
      }
    }
    
    // Partner Type (Looking For) - mandatory
    if (partnerType) {
      hasSearchCriteria = true;
      searchCriteria.push('Looking For');
      console.log('Filtering by partner type:', partnerType);
      
      const uniqueTiers = [...new Set(biotechData.map(item => item.tier))];
      console.log('Available tier values in data:', uniqueTiers);
      
      if (uniqueTiers.length > 0 && !uniqueTiers.every(tier => !tier)) {
        filteredData = filteredData.filter(item => {
          const itemTier = item.tier || '';
          let isMatch = false;
          
          console.log('Checking tier for:', item.companyName, 'Item tier:', itemTier, 'Search tier:', partnerType);
          
          if (partnerType === 'Tier 1 - Mostly Large Pharma') {
            isMatch = itemTier.toLowerCase().includes('large') || itemTier.toLowerCase().includes('large pharma');
          } else if (partnerType === 'Tier 2 - Mid Cap') {
            isMatch = itemTier.toLowerCase().includes('mid') || itemTier.toLowerCase().includes('mid cap');
          } else if (partnerType === 'Tier 3 - Small Cap') {
            isMatch = itemTier.toLowerCase().includes('small') || itemTier.toLowerCase().includes('small cap');
          }
          
          console.log('Tier match result:', isMatch, 'for company:', item.companyName);
          return isMatch;
        });
        console.log('After partner type filter, records found:', filteredData.length);
      }
    }
    
    // Development Stage - optional, skip if no stage data available
    if (developmentStage && developmentStage.trim() !== '') {
      console.log('Development stage provided:', developmentStage);
      console.log('Note: Stage of Development column not found in Excel data - skipping stage filter');
      // Don't add to searchCriteria since we're not actually filtering
      // Don't filter data since stage column doesn't exist
      console.log('Stage filter skipped - no stage data available in Excel');
    }
    
    // Modality - optional but if provided, must match
    if (modality) {
      hasSearchCriteria = true;
      searchCriteria.push('Modality');
      console.log('Filtering by modality:', modality);
      filteredData = filteredData.filter(item => {
        const itemModality = item.modality || '';
        let isMatch = false;
        
        console.log('Checking modality for:', item.companyName, 'Item modality:', itemModality, 'Search modality:', modality);
        console.log('Modality type:', typeof itemModality, 'Length:', itemModality.length);
        
        // Handle modality abbreviations (only what's actually in Excel)
        if (modality === 'Small Molecule') {
          isMatch = itemModality.toLowerCase().includes('sm') || itemModality.toLowerCase().includes('small molecule');
        } else if (modality === 'Large Molecule') {
          // Look for "LM" specifically (case insensitive)
          isMatch = itemModality.toLowerCase().includes('lm') || itemModality.toLowerCase().includes('large molecule');
          console.log('Large Molecule check:', itemModality, 'contains LM:', isMatch);
        } else if (modality === 'Cell Therapy') {
          isMatch = itemModality.toLowerCase().includes('ct') || itemModality.toLowerCase().includes('cell therapy');
        } else if (modality === 'Gene Therapy') {
          isMatch = itemModality.toLowerCase().includes('gt') || itemModality.toLowerCase().includes('gene therapy');
        } else if (modality === 'RNA Therapy') {
          isMatch = itemModality.toLowerCase().includes('rna') || itemModality.toLowerCase().includes('rna therapy');
        } else if (modality === 'Biologics') {
          isMatch = itemModality.toLowerCase().includes('bx') || itemModality.toLowerCase().includes('biologics');
        } else if (modality === 'Other') {
          // For "Other", check if it doesn't match any of the main modalities in Excel
          const mainModalities = ['sm', 'lm', 'ct', 'gt', 'rna', 'bx', 'rl', 'vc', 'mb', 'pdt', 'aso', 'st', 'gx'];
          isMatch = !mainModalities.some(mod => itemModality.toLowerCase().includes(mod));
        } else {
          // Fallback to general search
          isMatch = itemModality.toLowerCase().includes(modality.toLowerCase());
        }
        
        console.log('Modality match result:', isMatch, 'for company:', item.companyName);
        return isMatch;
      });
      console.log('After modality filter, records found:', filteredData.length);
    }
    
    // Drug Name - user enters their own drug, don't filter by it, just include it in results
    if (drugName && drugName.trim()) {
      console.log('User drug name:', drugName, '- will be displayed in results, not used for filtering');
      // Don't filter by drug name - user enters their own drug to sell
    }
    
    // Region - only filter if user selected it
    if (region) {
      hasSearchCriteria = true;
      searchCriteria.push('Region');
      console.log('Filtering by region:', region);
      filteredData = filteredData.filter(item => {
        const itemRegion = item.region || '';
        let isMatch = false;
        
        console.log('Checking region for:', item.companyName, 'Item region:', itemRegion, 'Search region:', region);
        
        // Handle region variations and abbreviations
        if (region === 'North America') {
          isMatch = itemRegion.toLowerCase().includes('usa') || 
                   itemRegion.toLowerCase().includes('united states') ||
                   itemRegion.toLowerCase().includes('us') ||
                   itemRegion.toLowerCase().includes('canada');
        } else if (region === 'Europe') {
          isMatch = itemRegion.toLowerCase().includes('germany') || 
                   itemRegion.toLowerCase().includes('france') ||
                   itemRegion.toLowerCase().includes('switzerland') ||
                   itemRegion.toLowerCase().includes('denmark') ||
                   itemRegion.toLowerCase().includes('uk');
        } else if (region === 'Asia') {
          isMatch = itemRegion.toLowerCase().includes('japan') || 
                   itemRegion.toLowerCase().includes('china');
        } else if (region === 'Africa') {
          // No African companies in your data currently
          isMatch = false;
        } else if (region === 'South America') {
          // No South American companies in your data currently
          isMatch = false;
        } else {
          // Fallback to general search for specific countries
          isMatch = itemRegion.toLowerCase().includes(region.toLowerCase());
        }
        
        console.log('Region match result:', isMatch, 'for company:', item.companyName);
        return isMatch;
      });
      console.log('After region filter, records found:', filteredData.length);
    }
    
    // Function - only filter if user selected it
    if (contactFunction) {
      hasSearchCriteria = true;
      searchCriteria.push('Function');
      console.log('Filtering by function:', contactFunction);
      filteredData = filteredData.filter(item => {
        const itemFunction = item.contactFunction || '';
        let isMatch = false;
        
        console.log('Checking function for:', item.companyName, 'Item function:', itemFunction, 'Search function:', contactFunction);
        
        // Handle frontend function options
        if (contactFunction === 'Business Development') {
          // Find all BD-related functions
          isMatch = itemFunction.toLowerCase().includes('business development') || 
                   itemFunction.toLowerCase().includes('bd') ||
                   itemFunction.toLowerCase().includes('business dev') ||
                   itemFunction.toLowerCase().includes('regulatory bd') ||
                   itemFunction.toLowerCase().includes('r&d business development') ||
                   itemFunction.toLowerCase().includes('international business development');
        } else if (contactFunction === 'Non-BD') {
          // Find all non-BD functions (exclude BD-related)
          const isBD = itemFunction.toLowerCase().includes('business development') || 
                      itemFunction.toLowerCase().includes('bd') ||
                      itemFunction.toLowerCase().includes('business dev') ||
                      itemFunction.toLowerCase().includes('regulatory bd') ||
                      itemFunction.toLowerCase().includes('r&d business development') ||
                      itemFunction.toLowerCase().includes('international business development');
          isMatch = !isBD && itemFunction.toLowerCase() !== 'na' && itemFunction.toLowerCase() !== 'not defined';
        } else if (contactFunction === 'All') {
          // Show both BD and non-BD functions (include all valid functions)
          isMatch = itemFunction.toLowerCase() !== 'na' && itemFunction.toLowerCase() !== 'not defined';
        } else {
          // Fallback to general search for specific functions
          isMatch = itemFunction.toLowerCase().includes(contactFunction.toLowerCase());
        }
        
        console.log('Function match result:', isMatch, 'for company:', item.companyName);
        return isMatch;
      });
      console.log('After function filter, records found:', filteredData.length);
    }
    
    console.log('Search criteria provided:', searchCriteria);
    console.log('Filtered data count:', filteredData.length);

    // If no search criteria provided, return empty results
    if (!hasSearchCriteria) {
      console.log('No search criteria provided. Returning empty results.');
      return res.json({
        success: true,
        data: {
          results: [],
          totalFound: 0,
          totalShown: 0,
          hasMore: false,
          message: 'Please select at least Disease Area and Looking For to search, or use the search bar to find companies or contacts.'
        }
      });
    }
    
    // If search criteria provided but no matches found, return empty results
    if (hasSearchCriteria && filteredData.length === 0) {
      console.log('Search criteria provided but no matches found. Returning empty results.');
      return res.json({
        success: true,
        data: {
          results: [],
          totalFound: 0,
          totalShown: 0,
          hasMore: false,
          message: `No Match Found. Please Refine Your Search Criterion`
        }
      });
    }
    
    // Show all results without any limits
    const limitedData = filteredData.map(item => ({
      id: item.id,
      companyName: item.companyName,
      contactPerson: item.contactPerson,
      contactTitle: item.contactTitle,
      contactFunction: item.contactFunction,
      region: item.region,
      tier: item.tier,
      modality: item.modality,
      partnerType: item.partnerType,
      // Show email for testing
      email: item.email,
      // Add all TA columns for complete data
      ta1_oncology: item.ta1_oncology,
      ta2_cardiovascular: item.ta2_cardiovascular,
      ta3_neuroscience: item.ta3_neuroscience,
      ta4_immunology_autoimmune: item.ta4_immunology_autoimmune,
      ta5_infectious_diseases: item.ta5_infectious_diseases,
      ta6_respiratory: item.ta6_respiratory,
      ta7_endocrinology_metabolic: item.ta7_endocrinology_metabolic,
      ta8_rare_orphan: item.ta8_rare_orphan,
      ta9_hematology: item.ta9_hematology,
      ta10_gastroenterology: item.ta10_gastroenterology,
      ta11_dermatology: item.ta11_dermatology,
      ta12_ophthalmology: item.ta12_ophthalmology,
      ta13_kidney_renal: item.ta13_kidney_renal,
      ta14_msk_disease: item.ta14_msk_disease,
      ta15_womens_health: item.ta15_womens_health,
      ta16_pain: item.ta16_pain,
      ta17_urology: item.ta17_urology,
      bdPersonTAFocus: item.bdPersonTAFocus
    }));

    res.json({
      success: true,
      data: {
        results: limitedData,
        totalFound: filteredData.length,
        totalShown: limitedData.length,
        hasMore: false, // Show all results
        message: filteredData.length === 0 ? 'No Match Found. Please Refine Your Search Criterion' : null
      }
    });
    
    // Save search data
    saveDataToFiles('search_performed');
    
  } catch (error) {
    console.error('Error searching biotech data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching data' 
    });
  }
});

// Get contact emails (paid feature)
app.post('/api/get-contacts', authenticateToken, [
  body('companyIds').isArray()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { companyIds } = req.body;
    
    // Get contact details for requested companies
    const contacts = biotechData
      .filter(item => companyIds.includes(item.id))
      .map(item => ({
        id: item.id,
        companyName: item.companyName,
        contactPerson: item.contactPerson,
        email: item.email,
        phone: item.phone,
        website: item.website
      }));

    res.json({
      success: true,
      data: {
        contacts,
        totalContacts: contacts.length,
        price: contacts.length * 99 // $99 per contact
      }
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting contacts' 
    });
  }
});

// Delete multiple records (admin only)
app.delete('/api/admin/delete-records', authenticateAdmin, (req, res) => {
  try {

    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request: ids array required' 
      });
    }

    const initialLength = biotechData.length;
    biotechData = biotechData.filter(item => !ids.includes(item.id));

    const deletedCount = initialLength - biotechData.length;

    // Save data to files
    saveDataToFiles('payment_success');

    res.json({
      success: true,
      message: `${deletedCount} records deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting records:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting records' 
    });
  }
});

// Delete single record (admin only)
app.delete('/api/admin/biotech-data/:id', authenticateAdmin, (req, res) => {
  try {

    const id = parseInt(req.params.id);
    const initialLength = biotechData.length;
    biotechData = biotechData.filter(item => item.id !== id);

    if (biotechData.length === initialLength) {
      return res.status(404).json({ 
        success: false, 
        message: 'Record not found' 
      });
    }

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting record' 
    });
  }
});

// Get admin statistics
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  try {

    const uniqueCompanies = new Set(biotechData.map(item => item.companyName)).size;
    const uniqueContacts = new Set(biotechData.map(item => item.email)).size;
    
    const stats = {
      totalRecords: biotechData.length,
      totalCompanies: uniqueCompanies,
      totalContacts: uniqueContacts,
      totalRevenue: biotechData.length * 99 // Assuming $99 per record
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching admin stats' 
    });
  }
});

// Debug endpoint to see uploaded data
app.get('/api/debug/data', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalRecords: biotechData.length,
        sampleRecords: biotechData.slice(0, 3),
        allRecords: biotechData,
        summary: {
          companies: [...new Set(biotechData.map(item => item.companyName))],
          tiers: [...new Set(biotechData.map(item => item.tier))],
          taColumns: Object.keys(biotechData[0] || {}).filter(key => key.startsWith('ta'))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching debug data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching debug data' 
    });
  }
});

// Connect to MongoDB
console.log('🔧 Initializing server...');
console.log('📡 Attempting MongoDB connection...');

// Data storage with file persistence
const DATA_FILE = path.join(__dirname, 'data', 'biotechData.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const VERIFICATION_FILE = path.join(__dirname, 'data', 'verificationCodes.json');
const UPLOADED_FILES_FILE = path.join(__dirname, 'data', 'uploadedFiles.json');
const BD_TRACKER_FILE = path.join(__dirname, 'data', 'bdTracker.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load data from files with recovery
const loadDataFromFiles = () => {
  try {
    // Load biotech data
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      biotechData = JSON.parse(data);
      console.log(`✅ Loaded ${biotechData.length} biotech records from file`);
    } else {
      console.log('⚠️ No biotech data file found, starting fresh');
    }

    // Load users
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      mockDB.users = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.users.length} users from file`);
    } else {
      console.log('⚠️ No users file found, starting fresh');
      mockDB.users = [];
    }

    // Load verification codes
    if (fs.existsSync(VERIFICATION_FILE)) {
      const data = fs.readFileSync(VERIFICATION_FILE, 'utf8');
      mockDB.verificationCodes = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.verificationCodes.length} verification codes from file`);
    } else {
      console.log('⚠️ No verification codes file found, starting fresh');
      mockDB.verificationCodes = [];
    }

    // Load uploaded files info
    if (fs.existsSync(UPLOADED_FILES_FILE)) {
      const data = fs.readFileSync(UPLOADED_FILES_FILE, 'utf8');
      mockDB.uploadedFiles = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.uploadedFiles.length} uploaded files info from file`);
    } else {
      console.log('⚠️ No uploaded files info found, starting fresh');
      mockDB.uploadedFiles = [];
    }

    // Load BD Tracker data
    if (fs.existsSync(BD_TRACKER_FILE)) {
      const data = fs.readFileSync(BD_TRACKER_FILE, 'utf8');
      mockDB.bdTracker = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.bdTracker.length} BD Tracker entries from file`);
    } else {
      console.log('⚠️ No BD Tracker file found, starting fresh');
      mockDB.bdTracker = [];
    }

    // Ensure universal users exist
    const universalEmails = [
      'universalx0242@gmail.com',
      'admin@bioping.com',
      'demo@bioping.com',
      'test@bioping.com'
    ];

    universalEmails.forEach(email => {
      const existingUser = mockDB.users.find(u => u.email === email);
      if (!existingUser) {
        console.log(`🔄 Creating universal user: ${email}`);
        const newUser = {
          id: mockDB.users.length + 1,
          firstName: email.split('@')[0],
          lastName: '',
          email: email,
          password: '$2a$10$20TtHYxGnnAA1EcZoXq06u2faT68sDulbmnMEJMyg.kRZBh6cicmS', // Default password: 'password'
          name: email.split('@')[0],
          role: 'user',
          createdAt: new Date().toISOString(),
          paymentCompleted: email === 'universalx0242@gmail.com' ? true : false,
          currentPlan: email === 'universalx0242@gmail.com' ? 'test' : 'free',
          currentCredits: email === 'universalx0242@gmail.com' ? 1 : 5
        };
        mockDB.users.push(newUser);
      }
    });

    // Save immediately after ensuring universal users exist
    saveDataToFiles('subscription_created');
    
  } catch (error) {
    console.error('❌ Error loading data from files:', error);
    console.log('🔄 Attempting to recover from backup...');
    
    // Try to recover from backup
    try {
      const backupDir = path.join(__dirname, 'backups');
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
        if (backupFiles.length > 0) {
          const latestBackup = backupFiles.sort().pop();
          const backupPath = path.join(backupDir, latestBackup);
          const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
          
          mockDB.users = backupData.users || [];
          mockDB.verificationCodes = backupData.verificationCodes || [];
          mockDB.uploadedFiles = backupData.uploadedFiles || [];
          mockDB.bdTracker = backupData.bdTracker || [];
          biotechData = backupData.biotechData || [];
          
          console.log('✅ Recovered data from backup:', latestBackup);
          saveDataToFiles('credit_used');
        }
      }
    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError);
      console.log('🔄 Starting with fresh data...');
      mockDB.users = [];
      mockDB.verificationCodes = [];
      mockDB.uploadedFiles = [];
      mockDB.bdTracker = [];
      biotechData = [];
    }
  }
};

// Enhanced save function that saves after every action
const saveDataToFiles = (action = 'auto') => {
  try {
    // Create backup before saving
    const backupDir = path.join(__dirname, 'backups', new Date().toISOString().split('T')[0]);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save biotech data
    fs.writeFileSync(DATA_FILE, JSON.stringify(biotechData, null, 2));
    console.log(`✅ Saved ${biotechData.length} biotech records (${action})`);
    
    // Save users
    fs.writeFileSync(USERS_FILE, JSON.stringify(mockDB.users, null, 2));
    console.log(`✅ Saved ${mockDB.users.length} users (${action})`);
    
    // Save verification codes
    fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(mockDB.verificationCodes, null, 2));
    console.log(`✅ Saved ${mockDB.verificationCodes.length} verification codes (${action})`);
    
    // Save uploaded files info
    fs.writeFileSync(UPLOADED_FILES_FILE, JSON.stringify(mockDB.uploadedFiles, null, 2));
    console.log(`✅ Saved ${mockDB.uploadedFiles.length} uploaded files info (${action})`);
    
    // Save BD Tracker data
    fs.writeFileSync(BD_TRACKER_FILE, JSON.stringify(mockDB.bdTracker, null, 2));
    console.log(`✅ Saved ${mockDB.bdTracker.length} BD Tracker entries (${action})`);
    
    console.log(`✅ All data saved successfully (${action})`);
  } catch (error) {
    console.error(`❌ Error saving data (${action}):`, error);
    // Try to save to backup location
    try {
      const backupFile = path.join(__dirname, 'backups', `backup-${Date.now()}.json`);
      const backupData = {
        users: mockDB.users,
        biotechData: biotechData,
        verificationCodes: mockDB.verificationCodes,
        uploadedFiles: mockDB.uploadedFiles,
        bdTracker: mockDB.bdTracker,
        timestamp: new Date().toISOString(),
        action: action
      };
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      console.log('✅ Emergency backup saved to:', backupFile);
    } catch (backupError) {
      console.error('❌ Emergency backup also failed:', backupError);
    }
  }
};

// Mock database connection for now
const mockDB = {
  users: [],
  verificationCodes: [],
  uploadedFiles: [], // Store uploaded file info
  bdTracker: [] // Store BD Tracker entries
};

// Load data on startup
loadDataFromFiles();

// Save data periodically (every 5 minutes)
setInterval(() => {
  saveDataToFiles('bd_entry_added');
}, 5 * 60 * 1000);

// Save data on server shutdown
process.on('SIGINT', () => {
  console.log('Saving data before shutdown...');
  saveDataToFiles('search_performed');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Saving data before shutdown...');
  saveDataToFiles('file_uploaded');
  process.exit(0);
});

// Email functionality removed - using universal login emails




// Get all users (admin only)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {

    // Return users from mockDB
    res.json({
      success: true,
      data: {
        users: mockDB.users,
        totalUsers: mockDB.users.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {

    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user' 
    });
  }
});

// BD Tracker API Endpoints

// Get all BD Tracker entries for specific user
app.get('/api/bd-tracker', authenticateToken, async (req, res) => {
  try {
    console.log('BD Tracker GET - User ID:', req.user.id);
    console.log('BD Tracker GET - User Email:', req.user.email);
    
    let userEntries = [];
    
    // Try MongoDB first
    try {
      userEntries = await BDTracker.find({ userId: req.user.id }).sort({ createdAt: -1 });
      console.log('BD Tracker GET - MongoDB entries:', userEntries.length);
    } catch (dbError) {
      console.log('MongoDB not available, using file-based storage...');
      // Fallback to file-based storage
      userEntries = mockDB.bdTracker.filter(entry => entry.userId === req.user.id);
      console.log('BD Tracker GET - File entries:', userEntries.length);
    }
    
    res.json({
      success: true,
      data: userEntries
    });
  } catch (error) {
    console.error('Error fetching BD Tracker entries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching BD Tracker entries' 
    });
  }
});

// Add new BD Tracker entry
app.post('/api/bd-tracker', authenticateToken, async (req, res) => {
  try {
    console.log('BD Tracker POST - User ID:', req.user.id);
    console.log('BD Tracker POST - User Email:', req.user.email);
    
    const { company, programPitched, outreachDates, contactFunction, contactPerson, cda, feedback, nextSteps, timelines, reminders } = req.body;

    // Validate required fields
    if (!company || !contactPerson) {
      return res.status(400).json({
        success: false,
        message: 'Company and Contact Person are required'
      });
    }

    let newEntry = null;

    // Try MongoDB first
    try {
      newEntry = new BDTracker({
        userId: req.user.id,
        company,
        programPitched: programPitched || '',
        outreachDates: outreachDates || '',
        contactFunction: contactFunction || '',
        contactPerson,
        cda: cda || '',
        feedback: feedback || '',
        nextSteps: nextSteps || '',
        timelines: timelines || '',
        reminders: reminders || '',
        status: 'active',
        priority: 'medium'
      });

      await newEntry.save();
      console.log('BD Tracker POST - MongoDB entry created:', newEntry._id);
    } catch (dbError) {
      console.log('MongoDB save failed, using file-based storage...');
      // Fallback to file-based storage
      newEntry = {
        id: Date.now().toString(),
        company,
        programPitched: programPitched || '',
        outreachDates: outreachDates || '',
        contactFunction: contactFunction || '',
        contactPerson,
        cda: cda || '',
        feedback: feedback || '',
        nextSteps: nextSteps || '',
        timelines: timelines || '',
        reminders: reminders || '',
        createdAt: new Date().toISOString(),
        userId: req.user.id
      };

      mockDB.bdTracker.unshift(newEntry);
      saveDataToFiles('bd_entry_added');
      console.log('BD Tracker POST - File entry created:', newEntry.id);
    }

    res.json({
      success: true,
      data: newEntry,
      message: 'BD Tracker entry added successfully'
    });
  } catch (error) {
    console.error('Error adding BD Tracker entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding BD Tracker entry' 
    });
  }
});

// Update BD Tracker entry
app.put('/api/bd-tracker/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { company, programPitched, outreachDates, contactFunction, contactPerson, cda, feedback, nextSteps, timelines, reminders } = req.body;

    // Validate required fields
    if (!company || !contactPerson) {
      return res.status(400).json({
        success: false,
        message: 'Company and Contact Person are required'
      });
    }

    let updatedEntry = null;

    // Try MongoDB first
    try {
      updatedEntry = await BDTracker.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        {
          company,
          programPitched: programPitched || '',
          outreachDates: outreachDates || '',
          contactFunction: contactFunction || '',
          contactPerson,
          cda: cda || '',
          feedback: feedback || '',
          nextSteps: nextSteps || '',
          timelines: timelines || '',
          reminders: reminders || ''
        },
        { new: true }
      );

      if (!updatedEntry) {
        return res.status(404).json({
          success: false,
          message: 'BD Tracker entry not found or not authorized'
        });
      }

      console.log('BD Tracker PUT - MongoDB entry updated:', updatedEntry._id);
    } catch (dbError) {
      console.log('MongoDB update failed, using file-based storage...');
      // Fallback to file-based storage
      const entryIndex = mockDB.bdTracker.findIndex(entry => entry.id === id && entry.userId === req.user.id);
      
      if (entryIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'BD Tracker entry not found or not authorized'
        });
      }

      mockDB.bdTracker[entryIndex] = {
        ...mockDB.bdTracker[entryIndex],
        company,
        programPitched: programPitched || '',
        outreachDates: outreachDates || '',
        contactFunction: contactFunction || '',
        contactPerson,
        cda: cda || '',
        feedback: feedback || '',
        nextSteps: nextSteps || '',
        timelines: timelines || '',
        reminders: reminders || '',
        updatedAt: new Date().toISOString()
      };

      updatedEntry = mockDB.bdTracker[entryIndex];
      saveDataToFiles('bd_entry_updated');
      console.log('BD Tracker PUT - File entry updated:', updatedEntry.id);
    }

    res.json({
      success: true,
      data: updatedEntry,
      message: 'BD Tracker entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating BD Tracker entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating BD Tracker entry' 
    });
  }
});

// Delete BD Tracker entry
app.delete('/api/bd-tracker/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    let deleted = false;

    // Try MongoDB first
    try {
      const result = await BDTracker.findOneAndDelete({ _id: id, userId: req.user.id });
      
      if (result) {
        console.log('BD Tracker DELETE - MongoDB entry deleted:', result._id);
        deleted = true;
      }
    } catch (dbError) {
      console.log('MongoDB delete failed, using file-based storage...');
      // Fallback to file-based storage
      const entryIndex = mockDB.bdTracker.findIndex(entry => entry.id === id && entry.userId === req.user.id);
      
      if (entryIndex !== -1) {
        mockDB.bdTracker.splice(entryIndex, 1);
        saveDataToFiles('bd_entry_deleted');
        console.log('BD Tracker DELETE - File entry deleted:', id);
        deleted = true;
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'BD Tracker entry not found or not authorized'
      });
    }

    res.json({
      success: true,
      message: 'BD Tracker entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting BD Tracker entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting BD Tracker entry' 
    });
  }
});

// Server will be started at the end of the file

// Forgot password endpoint
app.post('/api/auth/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email } = req.body;
    
    // Check if user exists
    const user = mockDB.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'No account found with this email address' 
      });
    }
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code for password reset
    mockDB.verificationCodes.push({
      email,
      code: verificationCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      type: 'password-reset' // Distinguish from email verification
    });

    // Save data to files
    saveDataToFiles();

    // Send email with verification code
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
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
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${verificationCode}</span>
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

      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email} with code: ${verificationCode}`);

      res.json({
        success: true,
        message: 'Password reset code sent successfully to your email'
      });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      console.log(`🔑 PASSWORD RESET CODE FOR ${email}: ${verificationCode}`);
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
app.post('/api/auth/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, code, newPassword } = req.body;
    
    // Find the verification code for password reset
    const verificationRecord = mockDB.verificationCodes.find(
      record => record.email === email && 
                record.code === code && 
                record.type === 'password-reset' &&
                new Date() < record.expiresAt
    );

    if (!verificationRecord) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification code' 
      });
    }

    // Find the user
    const user = mockDB.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password
    user.password = hashedPassword;

    // Remove the used verification code
    mockDB.verificationCodes = mockDB.verificationCodes.filter(
      record => !(record.email === email && record.code === code && record.type === 'password-reset')
    );

    // Save data to files
    saveDataToFiles();

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

// Protected route to get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    // Find the user in the database
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get payment status from localStorage (this would normally come from database)
    // For now, we'll return the basic user info and let frontend handle payment status
    res.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        // Payment info will be handled by frontend localStorage
        hasPaymentInfo: true // Indicates user can have payment data
      }
    });
    
    // Save profile access data
    saveDataToFiles('profile_accessed');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stripe Payment Routes
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    console.log('Payment intent request received:', req.body);
    const { amount, currency = 'usd', planId, isAnnual } = req.body;

    console.log('Stripe secret key available:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Processing payment for:', { amount, planId, isAnnual });

    // Define price IDs for different plans and billing cycles
    const priceIds = {
      'test': {
        monthly: 'price_test_monthly', // Replace with actual Stripe price ID
        annual: 'price_test_annual'    // Replace with actual Stripe price ID
      },
      'basic': {
        monthly: 'price_basic_monthly', // Replace with actual Stripe price ID
        annual: 'price_basic_annual'    // Replace with actual Stripe price ID
      },
      'premium': {
        monthly: 'price_premium_monthly', // Replace with actual Stripe price ID
        annual: 'price_premium_annual'    // Replace with actual Stripe price ID
      }
    };

    // Create or get customer for better tracking
    let customer = null;
    const customerEmail = req.body.customerEmail;
    
    console.log('Customer email:', customerEmail);
    
    if (customerEmail) {
      // Try to find existing customer
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('Found existing customer:', customer.id);
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            planId: planId,
            isAnnual: isAnnual ? 'true' : 'false'
          }
        });
        console.log('Created new customer:', customer.id);
      }
    }

    console.log('Creating payment intent with amount:', amount * 100);

    // Create payment intent with customer (if available) or as guest
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: currency,
      customer: customer ? customer.id : undefined, // Link to customer if available
      metadata: {
        planId: planId,
        isAnnual: isAnnual ? 'true' : 'false',
        customerType: customer ? 'registered' : 'guest',
        integration_check: 'accept_a_payment'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created successfully:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Payment failed', details: error.message });
  }
});

// Create subscription (for future use)
app.post('/api/create-subscription', async (req, res) => {
  try {
    const { planId, isAnnual, customerEmail } = req.body;

    // Define price IDs for different plans and billing cycles
    const priceIds = {
      'test': {
        monthly: 'price_test_monthly', // Replace with actual Stripe price ID
        annual: 'price_test_annual'    // Replace with actual Stripe price ID
      },
      'basic': {
        monthly: 'price_basic_monthly', // Replace with actual Stripe price ID
        annual: 'price_basic_annual'    // Replace with actual Stripe price ID
      },
      'premium': {
        monthly: 'price_premium_monthly', // Replace with actual Stripe price ID
        annual: 'price_premium_annual'    // Replace with actual Stripe price ID
      }
    };

    const priceId = priceIds[planId]?.[isAnnual ? 'annual' : 'monthly'];
    
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan or billing cycle' });
    }

    // Create or get customer
    let customer = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });

    if (customer.data.length === 0) {
      customer = await stripe.customers.create({
        email: customerEmail
      });
    } else {
      customer = customer.data[0];
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Subscription failed' });
  }
});



// Webhook for Stripe events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_ygLySaPSLLs4S4xpWuXWvblGsqA4nhV7';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Handle guest vs registered customer
      const customerType = paymentIntent.metadata?.customerType || 'guest';
      console.log('Customer type:', customerType);
      
      // Update user payment status in database if registered customer
      if (customerType === 'registered' && paymentIntent.metadata?.userEmail) {
        try {
          const userIndex = mockDB.users.findIndex(u => u.email === paymentIntent.metadata.userEmail);
          if (userIndex !== -1) {
            mockDB.users[userIndex].paymentCompleted = true;
            mockDB.users[userIndex].currentPlan = paymentIntent.metadata.planId || 'monthly';
            mockDB.users[userIndex].paymentUpdatedAt = new Date().toISOString();
            saveDataToFiles();
            console.log('User payment status updated in database');
          }
        } catch (error) {
          console.error('Error updating user payment status:', error);
        }
      }
      
      // Send payment confirmation email
      try {
        const customerEmail = paymentIntent.receipt_email || paymentIntent.customer_details?.email;
        if (customerEmail) {
          const mailOptions = {
            from: process.env.EMAIL_USER || 'universalx0242@gmail.com',
            to: customerEmail,
            subject: 'BioPing - Payment Confirmation',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Payment Confirmation</p>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #333; margin-bottom: 20px;">Payment Successful!</h2>
                  <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                    Thank you for your payment! Your transaction has been processed successfully.
                  </p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                      <span style="font-weight: bold;">Amount:</span>
                      <span>$${(paymentIntent.amount / 100).toFixed(2)} USD</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                      <span style="font-weight: bold;">Transaction ID:</span>
                      <span style="font-family: monospace;">${paymentIntent.id}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-weight: bold;">Date:</span>
                      <span>${new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    You will receive a detailed invoice shortly. If you have any questions, please contact our support team.
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
          console.log('Payment confirmation email sent to:', customerEmail);
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }
      break;

    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('Subscription created:', subscription.id);
      
      // Send subscription welcome email
      try {
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (customer.email) {
          const mailOptions = {
            from: process.env.EMAIL_USER || 'universalx0242@gmail.com',
            to: customer.email,
            subject: 'BioPing - Welcome to Your Subscription!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to Your Subscription!</p>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #333; margin-bottom: 20px;">Welcome to BioPing!</h2>
                  <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                    Your subscription has been activated successfully. You now have access to all the features included in your plan.
                  </p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                      <span style="font-weight: bold;">Subscription ID:</span>
                      <span style="font-family: monospace;">${subscription.id}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                      <span style="font-weight: bold;">Status:</span>
                      <span style="color: #10B981; font-weight: bold;">Active</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-weight: bold;">Next Billing:</span>
                      <span>${new Date(subscription.current_period_end * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    You can manage your subscription anytime from your account dashboard. If you have any questions, our support team is here to help!
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
          console.log('Subscription welcome email sent to:', customer.email);
        }
      } catch (emailError) {
        console.error('Failed to send subscription welcome email:', emailError);
      }
      break;

    case 'customer.subscription.updated':
      console.log('Subscription updated:', event.data.object.id);
      break;

    case 'customer.subscription.deleted':
      console.log('Subscription cancelled:', event.data.object.id);
      break;

    case 'invoice.payment_succeeded':
      console.log('Invoice payment succeeded:', event.data.object.id);
      break;

    case 'invoice.payment_failed':
      console.log('Invoice payment failed:', event.data.object.id);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email server status: ${transporter.verify() ? 'Ready' : 'Not ready'}`);
  console.log(`💳 Stripe integration: ${stripe ? 'Ready' : 'Not ready'}`);
}); 

// Update user payment status
app.post('/api/auth/update-payment-status', authenticateToken, (req, res) => {
  try {
    const { paymentCompleted, currentPlan, currentCredits, lastCreditRenewal, nextCreditRenewal } = req.body;
    
    // Find the user in the database
    const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user payment information
    mockDB.users[userIndex].paymentCompleted = paymentCompleted;
    mockDB.users[userIndex].currentPlan = currentPlan;
    mockDB.users[userIndex].paymentUpdatedAt = new Date().toISOString();
    
    // Update subscription data if provided
    if (currentCredits !== undefined) {
      mockDB.users[userIndex].currentCredits = currentCredits;
    }
    if (lastCreditRenewal) {
      mockDB.users[userIndex].lastCreditRenewal = lastCreditRenewal;
    }
    if (nextCreditRenewal) {
      mockDB.users[userIndex].nextCreditRenewal = nextCreditRenewal;
    }

    // Save to file
    saveDataToFiles();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      user: {
        email: mockDB.users[userIndex].email,
        name: mockDB.users[userIndex].name,
        paymentCompleted: mockDB.users[userIndex].paymentCompleted,
        currentPlan: mockDB.users[userIndex].currentPlan,
        currentCredits: mockDB.users[userIndex].currentCredits
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user payment status
app.get('/api/auth/payment-status', authenticateToken, (req, res) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only universalx0242 should have payment status
    // All other users should be free
    let hasPaid = false;
    let currentPlan = 'free';
    
    if (user.email === 'universalx0242@gmail.com') {
      hasPaid = user.paymentCompleted || true; // Force true for universalx0242
      currentPlan = user.currentPlan || 'monthly';
    } else {
      // Reset other users to free
      hasPaid = false;
      currentPlan = 'free';
      
      // Update user in database to ensure they're marked as free
      const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
      if (userIndex !== -1) {
        mockDB.users[userIndex].paymentCompleted = false;
        mockDB.users[userIndex].currentPlan = 'free';
        saveDataToFiles();
      }
    }

    res.json({
      paymentCompleted: hasPaid,
      currentPlan: currentPlan,
      paymentUpdatedAt: user.paymentUpdatedAt
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Subscription management endpoints
app.get('/api/auth/subscription-status', authenticateToken, (req, res) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if subscription is active and when credits should renew
    const now = new Date();
    const lastCreditRenewal = user.lastCreditRenewal ? new Date(user.lastCreditRenewal) : null;
    const nextRenewal = user.nextCreditRenewal ? new Date(user.nextCreditRenewal) : null;
    
    let shouldRenewCredits = false;
    let creditsToGive = 0;

    if (user.paymentCompleted && user.currentPlan && user.currentPlan !== 'free') {
      // Check if it's time to renew credits based on plan type
      if (!lastCreditRenewal || now >= nextRenewal) {
        shouldRenewCredits = true;
        
        // Set credits based on plan
        if (user.currentPlan === 'monthly' || user.currentPlan === 'basic') {
          creditsToGive = 50;
        } else if (user.currentPlan === 'annual' || user.currentPlan === 'premium') {
          creditsToGive = 100;
        } else if (user.currentPlan === 'test') {
          creditsToGive = 1;
        }
        
        // Update user with new credits and renewal date
        const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
        if (userIndex !== -1) {
          mockDB.users[userIndex].currentCredits = creditsToGive;
          mockDB.users[userIndex].lastCreditRenewal = now.toISOString();
          
          // Set renewal period based on plan type
          let renewalDays = 30; // Default monthly
          if (user.currentPlan === 'annual' || user.currentPlan === 'premium') {
            renewalDays = 30; // Annual plans have monthly EMI, so monthly renewal
          }
          // Monthly plans don't auto-renew, so no next renewal date
          if (user.currentPlan === 'monthly' || user.currentPlan === 'basic') {
            mockDB.users[userIndex].nextCreditRenewal = null; // No auto-renewal for monthly
          } else {
            mockDB.users[userIndex].nextCreditRenewal = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000).toISOString();
          }
          saveDataToFiles();
        }
      }
    }

    // Return current credits (don't override if user has used some)
    let currentCredits = user.currentCredits;
    if (currentCredits === undefined || currentCredits === null) {
      // Set default credits based on plan
      if (user.paymentCompleted && user.currentPlan && user.currentPlan !== 'free') {
        if (user.currentPlan === 'monthly') {
          currentCredits = 50;
        } else if (user.currentPlan === 'annual') {
          currentCredits = 100;
        } else if (user.currentPlan === 'test') {
          currentCredits = 1;
        }
      } else {
        currentCredits = 5; // Free users
      }
    }

    res.json({
      paymentCompleted: user.paymentCompleted || false,
      currentPlan: user.currentPlan || 'free',
      currentCredits: currentCredits,
      lastCreditRenewal: user.lastCreditRenewal,
      nextCreditRenewal: user.nextCreditRenewal,
      shouldRenewCredits,
      creditsToGive
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user credits (when they use credits)
app.post('/api/auth/use-credit', authenticateToken, (req, res) => {
  try {
    const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = mockDB.users[userIndex];
    
    if (user.currentCredits > 0) {
      user.currentCredits -= 1;
      saveDataToFiles('credit_used');
      
      res.json({
        success: true,
        remainingCredits: user.currentCredits,
        message: 'Credit used successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No credits remaining'
      });
    }
  } catch (error) {
    console.error('Error using credit:', error);
    res.status(500).json({ message: 'Server error' });
  }
}); 

// Data export endpoint (for backup)
app.get('/api/admin/export-data', authenticateAdmin, (req, res) => {
  try {
    const exportData = {
      users: mockDB.users,
      biotechData: biotechData,
      verificationCodes: mockDB.verificationCodes,
      uploadedFiles: mockDB.uploadedFiles,
      bdTracker: mockDB.bdTracker,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="bioping-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
});

// Data import endpoint (for restore)
app.post('/api/admin/import-data', authenticateAdmin, upload.single('backup'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No backup file provided' });
    }
    
    const backupData = JSON.parse(req.file.buffer.toString());
    
    // Validate backup data
    if (!backupData.users || !backupData.biotechData) {
      return res.status(400).json({ message: 'Invalid backup file format' });
    }
    
    // Import data
    mockDB.users = backupData.users || [];
    mockDB.verificationCodes = backupData.verificationCodes || [];
    mockDB.uploadedFiles = backupData.uploadedFiles || [];
    mockDB.bdTracker = backupData.bdTracker || [];
    biotechData = backupData.biotechData || [];
    
    // Save imported data
    saveDataToFiles('data_imported');
    
    res.json({ 
      message: 'Data imported successfully',
      importedUsers: mockDB.users.length,
      importedBiotechRecords: biotechData.length,
      importedBdTrackerEntries: mockDB.bdTracker.length
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Import failed' });
  }
}); 

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log(`🔧 Signup attempt for: ${email}`);

    // Check if user already exists (try MongoDB first, then fallback to file-based)
    let existingUser = null;
    try {
      console.log('🔍 Checking MongoDB for existing user...');
      existingUser = await User.findOne({ email });
      console.log('✅ MongoDB query completed');
    } catch (dbError) {
      console.log('❌ MongoDB not available, checking file-based storage...');
      console.log('MongoDB Error:', dbError.message);
      existingUser = mockDB.users.find(u => u.email === email);
    }

    if (existingUser) {
      console.log('⚠️ User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user object
    const newUserData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      company: 'BioPing',
      role: 'other',
      paymentCompleted: false,
      currentPlan: 'free',
      currentCredits: 5
    };

    let newUser = null;
    let userId = null;

    // Try to save to MongoDB first
    try {
      console.log('💾 Attempting to save user to MongoDB...');
      newUser = new User(newUserData);
      await newUser.save();
      userId = newUser._id;
      console.log(`✅ New user saved to MongoDB: ${email} (ID: ${userId})`);
    } catch (dbError) {
      console.log('❌ MongoDB save failed, using file-based storage...');
      console.log('MongoDB Save Error:', dbError.message);
      // Fallback to file-based storage
      newUser = {
        id: mockDB.users.length + 1,
        ...newUserData,
        name: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString()
      };
      mockDB.users.push(newUser);
      userId = newUser.id;
      saveDataToFiles('user_signup');
      console.log(`✅ New user saved to file: ${email} (ID: ${userId})`);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        email: newUser.email,
        name: newUser.name || `${firstName} ${lastName}`,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`🎉 New user registered successfully: ${email}`);

    res.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email: newUser.email,
        name: newUser.name || `${firstName} ${lastName}`,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

