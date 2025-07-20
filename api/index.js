const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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