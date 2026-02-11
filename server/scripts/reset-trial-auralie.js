/**
 * One-time script to reset trial for auralie@yissum.co.il
 * Trial starts Feb 9, 2025 - 5 days until Feb 14, 2025
 * Run: node server/scripts/reset-trial-auralie.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const USER_EMAIL = 'auralie@yissum.co.il';
const TRIAL_START = new Date('2025-02-10');
const CREDITS = 5;

async function resetTrial() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const User = require('../models/User');
    const user = await User.findOne({ email: new RegExp(`^${USER_EMAIL}$`, 'i') });
    
    if (!user) {
      console.log('❌ User not found in MongoDB, trying file storage...');
      const fs = require('fs');
      const path = require('path');
      const usersPath = path.join(__dirname, '..', 'data', 'users.json');
      if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        const fileUser = users.find(u => u.email && u.email.toLowerCase() === USER_EMAIL.toLowerCase());
        if (fileUser) {
          fileUser.freeTrialStartDate = TRIAL_START.toISOString();
          fileUser.currentCredits = CREDITS;
          fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
          console.log(`✅ Trial reset in file storage for ${USER_EMAIL}`);
          console.log(`   Trial start: ${TRIAL_START.toISOString().split('T')[0]}`);
          console.log(`   Trial end: Feb 14, 2025`);
          console.log(`   Credits: ${CREDITS}`);
          process.exit(0);
        }
      }
      console.log('❌ User not found in file storage either');
      process.exit(1);
    }

    user.freeTrialStartDate = TRIAL_START;
    user.currentCredits = CREDITS;
    await user.save();
    
    console.log(`✅ Trial reset for ${USER_EMAIL}`);
    console.log(`   Trial start: ${TRIAL_START.toISOString().split('T')[0]}`);
    console.log(`   Trial end: Feb 15, 2025`);
    console.log(`   Credits: ${CREDITS}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetTrial();
