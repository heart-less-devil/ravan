const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB URI - using the provided connection string
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      bufferMaxEntries: 0,
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
      appName: 'BioPing'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Set global query timeout
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferMaxEntries', 0);
    
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
    console.error('❌ MongoDB connection error:', error);
    console.log('🔄 Continuing with file-based storage...');
    // Don't throw error, let the app continue with file-based storage
  }
};

module.exports = connectDB; 