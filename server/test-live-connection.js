const mongoose = require('mongoose');

const testLiveConnection = async () => {
  try {
    console.log('🔧 Testing live MongoDB connection...');
    
    const mongoURI = 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Live MongoDB connected successfully!');
    
    // Test user creation
    const User = require('./models/User');
    
    const testUser = new User({
      firstName: 'Test',
      lastName: 'Live',
      email: 'testlive@bioping.com',
      password: 'hashedpassword',
      company: 'Test Company',
      role: 'other',
      paymentCompleted: false,
      currentPlan: 'free',
      currentCredits: 5
    });
    
    await testUser.save();
    console.log('✅ Test user created in live database!');
    
    // Check if user exists
    const foundUser = await User.findOne({ email: 'testlive@bioping.com' });
    console.log('✅ Test user found:', foundUser.email);
    
    // Clean up
    await User.deleteOne({ email: 'testlive@bioping.com' });
    console.log('✅ Test user cleaned up!');
    
    console.log('🎉 Live MongoDB test passed!');
    
  } catch (error) {
    console.error('❌ Live MongoDB test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from live MongoDB');
  }
};

testLiveConnection(); 