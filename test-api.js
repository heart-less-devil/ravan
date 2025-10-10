const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testSubscriptionAPI() {
  try {
    console.log('🔍 Testing subscription API...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
    
    // Get user data
    const user = await User.findOne({ email: 'evil04eye08@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('📊 User Data:');
    console.log('  Email:', user.email);
    console.log('  Credits:', user.currentCredits);
    console.log('  Plan:', user.currentPlan);
    console.log('  Payment:', user.paymentCompleted);
    
    // Generate JWT token
    const token = jwt.sign({
      id: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role
    }, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: '1h' });
    
    console.log('🔑 Token generated');
    
    // Test subscription endpoint logic
    const now = new Date();
    const registrationDate = new Date(user.createdAt);
    const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    const trialDays = 5;
    const trialExpired = daysSinceRegistration >= trialDays;
    const trialDaysRemaining = Math.max(0, trialDays - daysSinceRegistration);
    
    console.log('📅 Trial Info:');
    console.log('  Days since signup:', daysSinceRegistration);
    console.log('  Trial expired:', trialExpired);
    console.log('  Trial days remaining:', trialDaysRemaining);
    
    // Return current credits from database (NO MODIFICATION)
    let currentCredits = user.currentCredits || 0;
    
    console.log('💳 Final Credits:');
    console.log('  Raw credits from DB:', user.currentCredits);
    console.log('  Processed credits:', currentCredits);
    console.log('  Should show in UI:', currentCredits);
    
    // For expired free trial users, enforce 0 credits
    if (!user.paymentCompleted && user.currentPlan === 'free' && trialExpired) {
      if (user.currentCredits > 0) {
        console.log('⚠️ Free trial expired, setting credits to 0');
        currentCredits = 0;
      }
    }
    
    console.log('✅ API Response would be:');
    console.log({
      paymentCompleted: user.paymentCompleted || false,
      currentPlan: user.currentPlan || 'free',
      currentCredits: currentCredits,
      trialExpired,
      daysRemaining: user.paymentCompleted && user.currentPlan !== 'free' ? null : trialDaysRemaining
    });
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSubscriptionAPI();
