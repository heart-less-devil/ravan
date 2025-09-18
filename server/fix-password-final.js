const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load users data
const usersPath = path.join(__dirname, 'data', 'users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

console.log('🔧 FINAL PASSWORD FIX for amankk0007@gmail.com...');

// Find the user
const user = users.find(u => u.email === 'amankk0007@gmail.com');
if (user) {
  console.log(`📧 Found user: ${user.email}`);
  console.log(`📝 Current password hash: ${user.password}`);
  
  // Hash the password "Wildboy07@"
  const hashedPassword = bcrypt.hashSync('Wildboy07@', 10);
  user.password = hashedPassword;
  
  console.log(`✅ Updated password hash: ${hashedPassword}`);
  console.log(`🔑 New password: Wildboy07@`);
  
  // Verify the hash works
  const isValid = bcrypt.compareSync('Wildboy07@', hashedPassword);
  console.log(`✅ Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
  
} else {
  console.log(`❌ User not found: amankk0007@gmail.com`);
}

// Save updated users
fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
console.log('\n✅ Password updated and saved successfully!');
console.log('\n📋 FINAL LOGIN CREDENTIALS:');
console.log('   Email: amankk0007@gmail.com');
console.log('   Password: Wildboy07@');
console.log('\n🚀 Ready for deployment!'); 