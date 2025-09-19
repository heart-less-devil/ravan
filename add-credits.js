const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';

async function addCreditsToUser() {
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
      console.log('Available users:');
      const allUsers = await User.find({}, 'email firstName lastName currentCredits');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.firstName} ${u.lastName}) - Credits: ${u.currentCredits}`);
      });
      return;
    }

    console.log(`👤 Found user: ${user.email} (${user.firstName} ${user.lastName})`);
    console.log(`💰 Current credits: ${user.currentCredits}`);

    // Add 10 credits
    const newCredits = (user.currentCredits || 0) + 10;
    
    // Update user credits
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { 
        currentCredits: newCredits,
        lastCreditRenewal: new Date()
      },
      { new: true }
    );

    console.log(`✅ Successfully added 10 credits to ${updatedUser.email}`);
    console.log(`💰 New credit balance: ${updatedUser.currentCredits}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the function
addCreditsToUser();
