const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB URI - using the provided connection string
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔄 Attempting MongoDB connection...');
    console.log('🔍 MongoDB URI (masked):', mongoURI.replace(/\/\/.*@/, '//***:***@'));
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000, // Reduced to 15 seconds
      socketTimeoutMS: 20000, // Reduced timeout
      bufferCommands: false,
      maxPoolSize: 5, // Reduced pool size
      minPoolSize: 1,
      maxIdleTimeMS: 20000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
      appName: 'BioPing'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Set global query timeout
    mongoose.set('bufferCommands', true); // Allow buffering until connection is ready
    
    // Set global query timeout for all operations
    mongoose.set('maxTimeMS', 10000);
    
    // Add connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('🟢 MongoDB connection established');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('🔴 MongoDB connection error:', err);
      if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
        console.log('⚠️ MongoDB timeout, falling back to file storage...');
      }
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🟡 MongoDB disconnected');
    });
    
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
    console.error('❌ MongoDB connection error:', error.message);
    
    // Check for specific error types
    if (error.message.includes('IP') || error.message.includes('whitelist') || error.message.includes('network')) {
      console.log('🚨 IP WHITELIST ISSUE DETECTED!');
      console.log('📋 SOLUTION:');
      console.log('   1. Go to MongoDB Atlas Dashboard');
      console.log('   2. Navigate to Network Access');
      console.log('   3. Add IP Address: 0.0.0.0/0 (Allow all)');
      console.log('   4. Or add your current IP address');
      console.log('🌐 Current connection attempt from local machine');
    }
    
    if (error.message.includes('authentication')) {
      console.log('🔑 AUTHENTICATION ISSUE - Check username/password');
    }
    
    console.log('🔄 Continuing with file-based storage for now...');
    console.log('💾 All data will be saved to server/data/ files');
    // Don't throw error, let the app continue with file-based storage
  }
};

module.exports = connectDB; 