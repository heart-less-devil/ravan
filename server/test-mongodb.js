const mongoose = require('mongoose');
const User = require('./models/User');

const testMongoDB = async () => {
  try {
    console.log('🔧 Testing MongoDB connection...');
    
    // Test connection
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bioping';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully!');
    
    // Test user creation
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@bioping.com',
      password: 'hashedpassword',
      company: 'Test Company',
      role: 'other',
      paymentCompleted: false,
      currentPlan: 'free',
      currentCredits: 5
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully!');
    
    // Test user retrieval
    const foundUser = await User.findOne({ email: 'test@bioping.com' });
    console.log('✅ Test user retrieved:', foundUser.email);
    
    // Clean up
    await User.deleteOne({ email: 'test@bioping.com' });
    console.log('✅ Test user cleaned up!');
    
    console.log('🎉 All MongoDB tests passed!');
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  testMongoDB();
}

module.exports = testMongoDB; 