require('dotenv').config();

console.log('🔧 Email Configuration Test:');
console.log('============================');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET (hidden)' : 'NOT SET');
console.log('============================');

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('✅ Email credentials are configured');
} else {
  console.log('❌ Email credentials are missing');
  console.log('Please create a .env file with:');
  console.log('EMAIL_USER=universalx0242@gmail.com');
  console.log('EMAIL_PASS=your-app-password');
} 