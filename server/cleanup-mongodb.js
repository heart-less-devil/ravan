const mongoose = require('mongoose');

const cleanupMongoDB = async () => {
  try {
    console.log('🔧 Cleaning up MongoDB...');
    
    const mongoURI = 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    const User = require('./models/User');
    
    // Find all users
    const allUsers = await User.find({});
    console.log(`📊 Total users found: ${allUsers.length}`);
    
    // Find users with missing lastName
    const invalidUsers = await User.find({ lastName: { $exists: false } });
    console.log(`❌ Users with missing lastName: ${invalidUsers.length}`);
    
    if (invalidUsers.length > 0) {
      console.log('🧹 Removing invalid users...');
      await User.deleteMany({ lastName: { $exists: false } });
      console.log('✅ Invalid users removed');
    }
    
    // Create proper universal users
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
      } else {
        console.log(`✅ Universal user already exists: ${email}`);
      }
    }
    
    console.log('🎉 MongoDB cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
};

cleanupMongoDB(); 