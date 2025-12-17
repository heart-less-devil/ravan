const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createBrittanyAccount() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000
    });
    console.log('✅ MongoDB Connected');
    
    const email = 'brittany.filips@thebioping.com';
    const password = 'Brittany07@';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('⚠️ User already exists!');
      console.log('Email:', existingUser.email);
      console.log('Name:', existingUser.firstName + ' ' + existingUser.lastName);
      console.log('Is Approved:', existingUser.isApproved);
      console.log('Status:', existingUser.status);
      console.log('Current Plan:', existingUser.currentPlan);
      console.log('Current Credits:', existingUser.currentCredits);
      console.log('Payment Completed:', existingUser.paymentCompleted);
      
      // Update password if needed
      const passwordMatch = await bcrypt.compare(password, existingUser.password);
      if (!passwordMatch) {
        console.log('🔄 Updating password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUser.password = hashedPassword;
        await existingUser.save();
        console.log('✅ Password updated');
      } else {
        console.log('✅ Password is already correct');
      }
      
      // Ensure master account settings
      if (!existingUser.isApproved || existingUser.status !== 'active' || existingUser.currentCredits < 999999) {
        console.log('🔄 Updating to master account settings...');
        existingUser.isApproved = true;
        existingUser.status = 'active';
        existingUser.paymentCompleted = true;
        existingUser.currentPlan = 'premium';
        existingUser.currentCredits = 999999;
        existingUser.isVerified = true;
        existingUser.otpVerifiedAt = new Date();
        await existingUser.save();
        console.log('✅ Master account settings applied');
      }
      
      await mongoose.disconnect();
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user with master account settings
    const newUser = new User({
      firstName: 'Brittany',
      lastName: 'Filips',
      email: email.toLowerCase(),
      password: hashedPassword,
      company: 'BioPing',
      role: 'other',
      isVerified: true,
      otpVerifiedAt: new Date(),
      isApproved: true, // Auto-approved
      status: 'active', // Active status
      paymentCompleted: true, // Treated as paid
      currentPlan: 'premium', // Premium plan
      currentCredits: 999999 // Unlimited credits
    });
    
    await newUser.save();
    console.log('✅ Master account created successfully!');
    console.log('Email:', newUser.email);
    console.log('Password:', password);
    console.log('Name:', newUser.firstName + ' ' + newUser.lastName);
    console.log('Is Approved:', newUser.isApproved);
    console.log('Status:', newUser.status);
    console.log('Current Plan:', newUser.currentPlan);
    console.log('Current Credits:', newUser.currentCredits);
    console.log('Payment Completed:', newUser.paymentCompleted);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createBrittanyAccount();
