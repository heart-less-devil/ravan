const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://gauravvij1980:gauravvij1980@cluster0.mongodb.net/biotechdata?retryWrites=true&w=majority');
    console.log('✅ MongoDB Connected');
    
    const user = await User.findOne({ email: 'gauravvij1980@gmail.com' });
    if (user) {
      console.log('✅ Gaurav found in MongoDB:');
      console.log('Email:', user.email);
      console.log('Name:', user.name || user.firstName + ' ' + user.lastName);
      console.log('Role:', user.role);
      console.log('Payment Completed:', user.paymentCompleted);
      console.log('Current Plan:', user.currentPlan);
      console.log('Current Credits:', user.currentCredits);
      console.log('Is Approved:', user.isApproved);
      console.log('Created At:', user.createdAt);
    } else {
      console.log('❌ Gaurav not found in MongoDB');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser();
