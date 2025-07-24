const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const testSignup = async () => {
  try {
    console.log('🔧 Testing MongoDB signup functionality...');
    
    // Connect to MongoDB
    const mongoURI = 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully!');
    
    // Test user data
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      company: 'BioPing',
      role: 'other',
      paymentCompleted: false,
      currentPlan: 'free',
      currentCredits: 5
    };
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    if (existingUser) {
      console.log('⚠️ Test user already exists, deleting...');
      await User.findByIdAndDelete(existingUser._id);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    
    // Create new user
    const newUser = new User({
      ...testUser,
      password: hashedPassword
    });
    
    await newUser.save();
    console.log('✅ Test user created successfully!');
    console.log('📧 Email:', newUser.email);
    console.log('🆔 ID:', newUser._id);
    
    // Test login
    const foundUser = await User.findOne({ email: testUser.email });
    if (foundUser) {
      const isValidPassword = await bcrypt.compare(testUser.password, foundUser.password);
      console.log('🔐 Password verification:', isValidPassword ? '✅ Success' : '❌ Failed');
    }
    
    // Clean up - delete test user
    await User.findByIdAndDelete(newUser._id);
    console.log('🧹 Test user cleaned up');
    
    console.log('🎉 MongoDB signup test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

testSignup(); 