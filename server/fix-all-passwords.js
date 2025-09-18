const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load users data
const usersPath = path.join(__dirname, 'data', 'users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

console.log('🔧 FIXING ALL USER PASSWORDS...\n');

// Universal password hash for most users
const universalHash = '$2a$10$20TtHYxGnnAA1EcZoXq06u2faT68sDulbmnMEJMyg.kRZBh6cicmS';

// Define specific passwords for users
const userPasswords = {
  'amankk0007@gmail.com': 'Wildboy07@',
  'nishax03261@gmail.com': 'Wildboy07@',
  'charusharma3261@gmail.com': 'Wildboy07@',
  'audiostock9@gmail.com': 'Wildboy07@',
  'universalx0242@gmail.com': 'Wildboy07@',
  'admin@bioping.com': 'Wildboy07@',
  'demo@bioping.com': 'Wildboy07@',
  'test@bioping.com': 'Wildboy07@',
  'gaurav@bioping.com': 'Wildboy07@',
  'rahul@bioping.com': 'Wildboy07@',
  'priya@bioping.com': 'Wildboy07@',
  'vikram@bioping.com': 'Wildboy07@'
};

let updatedCount = 0;

users.forEach((user, index) => {
  console.log(`\n👤 User ${index + 1}: ${user.email}`);
  
  // Get the password for this user
  const password = userPasswords[user.email] || 'Wildboy07@';
  
  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  // Update the user's password
  user.password = hashedPassword;
  
  // Verify the password works
  const isValid = bcrypt.compareSync(password, hashedPassword);
  
  console.log(`   ✅ Password: ${password}`);
  console.log(`   ✅ Verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
  
  updatedCount++;
});

// Save updated users
fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

console.log(`\n🎉 SUCCESS! Updated ${updatedCount} users!`);
console.log('\n📋 ALL LOGIN CREDENTIALS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

users.forEach(user => {
  const password = userPasswords[user.email] || 'Wildboy07@';
  console.log(`📧 ${user.email}`);
  console.log(`🔑 Password: ${password}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

console.log('\n🚀 All users can now login with their passwords!');
console.log('💡 Universal password for most users: Wildboy07@'); 