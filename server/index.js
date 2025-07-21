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
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const VerificationCode = require('./models/VerificationCode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());

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

// Universal emails that can login without signup
const universalEmails = [
  'universalx0242@gmail.com',
  'admin@bioping.com',
  'demo@bioping.com',
  'test@bioping.com',
  'user@bioping.com',
  'guest@bioping.com'
];

// Dummy user data (in production, this would be in a database)
const dummyUser = {
  email: 'universalx0242@gmail.com',
  password: '$2a$10$YourHashedPasswordHere', // This will be hashed
  name: 'Admin User',
  role: 'admin'
};

// Hash the dummy password immediately
(async () => {
  try {
    const hash = await bcrypt.hash('password', 10);
    dummyUser.password = hash;
    console.log('Password hashed successfully');
  } catch (error) {
    console.error('Error hashing password:', error);
  }
})();

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
      to: 'test@example.com',
      subject: 'Test Email - BioPing',
      text: 'This is a test email from BioPing server.'
    };

    const result = await transporter.sendMail(testMailOptions);
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId
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

    // Check if user exists in mockDB or is universal user
    let user = mockDB.users.find(u => u.email === email);
    let isUniversalUser = false;

    if (!user) {
      // Check if it's a universal email
      if (universalEmails.includes(email)) {
        user = {
          email: email,
          password: dummyUser.password, // Use the same hashed password
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) + ' User',
          role: email === 'universalx0242@gmail.com' ? 'admin' : 'user'
        };
        isUniversalUser = true;
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: user.email, 
        name: isUniversalUser ? user.name : `${user.firstName} ${user.lastName}`,
        role: user.role || 'user'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        email: user.email,
        name: isUniversalUser ? user.name : `${user.firstName} ${user.lastName}`,
        role: user.role || 'user'
      },
      credits: isUniversalUser ? 5 : 0 // Give 5 credits to universal users
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    user: {
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
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
app.get('/api/admin/biotech-data', (req, res) => {
  try {

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
app.post('/api/admin/upload-excel', upload.single('file'), (req, res) => {
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
          // Exact match for company name (case insensitive)
          return item.companyName && item.companyName.toLowerCase() === query;
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
          message: `🔍 **Search Results: No Matches Found**\n\nWe couldn't find any companies matching your specific criteria:\n\n**Your Search Criteria:**\n${searchCriteria.map(criteria => `• ${criteria}`).join('\n')}\n\n**Suggestions to broaden your search:**\n• Try different Disease Areas\n• Consider other Partner Tiers\n• Adjust Modality preferences\n• Explore different Regions\n• Review Function filters\n\n💡 **Pro Tip:** Start with broader criteria and then narrow down your search for better results.`
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
        message: filteredData.length === 0 ? 'No results found. Please try different search criteria.' : null
      }
    });
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
app.delete('/api/admin/delete-records', (req, res) => {
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
app.delete('/api/admin/biotech-data/:id', (req, res) => {
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
app.get('/api/admin/stats', (req, res) => {
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
console.log('Starting server without MongoDB for now...');
console.log('Server will run with in-memory storage');

// Mock database connection for now
const mockDB = {
  users: [],
  verificationCodes: [],
  uploadedFiles: [] // Store uploaded file info
};

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Send verification code
app.post('/api/auth/send-verification', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address' 
      });
    }

    const { email } = req.body;
    
    // Check if user already exists
    const existingUser = mockDB.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete any existing verification codes for this email
    mockDB.verificationCodes = mockDB.verificationCodes.filter(code => code.email !== email);
    
    // Store code in mock database with expiration (5 minutes)
    mockDB.verificationCodes.push({
      email,
      code: verificationCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      used: false
    });

    // Email template
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Email Verification - BioPing',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thank you for signing up with BioPing! To complete your registration, please use the verification code below:
            </p>
            
            <div style="background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${verificationCode}
              </div>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              This code will expire in <strong>5 minutes</strong>. If you didn't request this verification, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                Best regards,<br>
                The BioPing Team
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Send email (mock for now)
    console.log('Attempting to send email to:', email);
    console.log('Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    // For development/testing, use mock email sending
    console.log('=== DEVELOPMENT MODE ===');
    console.log('Verification code for testing:', verificationCode);
    console.log('Email would be sent to:', email);
    console.log('=== END DEVELOPMENT MODE ===');
    
    // Comment out real email sending for now
    // const result = await transporter.sendMail(mailOptions);
    // console.log('Email sent successfully:', result.messageId);

    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    res.status(500).json({ 
      success: false, 
      message: `Failed to send verification code: ${error.message}` 
    });
  }
});

// Verify email code
app.post('/api/auth/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid input' 
      });
    }

    const { email, code } = req.body;
    
    // Find verification code in mock database
    const verificationCode = mockDB.verificationCodes.find(vc => 
      vc.email === email && 
      vc.code === code && 
      !vc.used &&
      vc.expiresAt > new Date()
    );
    
    if (!verificationCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code' 
      });
    }

    // Mark code as used
    verificationCode.used = true;

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying email' 
    });
  }
});

// Create user account
app.post('/api/auth/create-account', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid input', 
        errors: errors.array() 
      });
    }

    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = mockDB.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in mock database
    const newUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      company: 'N/A',
      role: 'user',
      isVerified: true,
      createdAt: new Date()
    };

    mockDB.users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: newUser.email, 
        name: `${newUser.firstName} ${newUser.lastName}`,
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        email: newUser.email,
        name: `${newUser.firstName} ${newUser.lastName}`,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating account' 
    });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', async (req, res) => {
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
app.delete('/api/admin/users/:id', async (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 