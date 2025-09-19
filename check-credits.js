const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';

async function checkAndUpdateCredits() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email containing "universal"
    const user = await User.findOne({ 
      $or: [
        { email: { $regex: /universal/i } },
        { firstName: { $regex: /universal/i } },
        { lastName: { $regex: /universal/i } }
      ]
    });

    if (!user) {
      console.log('❌ User with "universal" not found');
      return;
    }

    console.log(`👤 Found user: ${user.email} (${user.firstName} ${user.lastName})`);
    console.log(`💰 Current credits: ${user.currentCredits}`);

    // Add 10 credits
    const newCredits = (user.currentCredits || 0) + 10;
    
    console.log(`🔄 Adding 10 credits...`);
    console.log(`💰 New credits will be: ${newCredits}`);

    // Update user credits using $inc to ensure atomic operation
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { 
        $inc: { currentCredits: 10 },
        lastCreditRenewal: new Date()
      },
      { new: true }
    );

    console.log(`✅ Successfully added 10 credits to ${updatedUser.email}`);
    console.log(`💰 New credit balance: ${updatedUser.currentCredits}`);

    // Verify the update
    const verifyUser = await User.findById(user._id);
    console.log(`🔍 Verification - Current credits: ${verifyUser.currentCredits}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the function
checkAndUpdateCredits();
