const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bioping';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create universal users if they don't exist
    const User = require('../models/User');
    
    const universalEmails = [
      'universalx0242@gmail.com',
      'admin@bioping.com',
      'demo@bioping.com',
      'test@bioping.com'
    ];

    for (const email of universalEmails) {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password', 10);
        
        const newUser = new User({
          firstName: email.split('@')[0],
          lastName: 'User',
          email: email,
          password: hashedPassword,
          company: 'BioPing',
          role: 'other',
          paymentCompleted: email === 'universalx0242@gmail.com',
          currentPlan: email === 'universalx0242@gmail.com' ? 'test' : 'free',
          currentCredits: email === 'universalx0242@gmail.com' ? 1 : 5
        });
        
        await newUser.save();
        console.log(`✅ Created universal user: ${email}`);
      }
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('🔄 Continuing with file-based storage...');
    // Don't throw error, let the app continue with file-based storage
  }
};

module.exports = connectDB; 