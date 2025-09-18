const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load users data
const usersPath = path.join(__dirname, 'data', 'users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

console.log('🔧 Fixing password for amankk0007@gmail.com...');

// Find the user
const user = users.find(u => u.email === 'amankk0007@gmail.com');
if (user) {
  // Hash the password "Wildboy07@"
  const hashedPassword = bcrypt.hashSync('Wildboy07@', 10);
  user.password = hashedPassword;
  console.log(`✅ Updated password for: amankk0007@gmail.com`);
  console.log(`   New password: Wildboy07@`);
} else {
  console.log(`❌ User not found: amankk0007@gmail.com`);
}

// Save updated users
fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
console.log('\n✅ Password updated successfully!');
console.log('\n📋 Login credentials:');
console.log('   Email: amankk0007@gmail.com');
console.log('   Password: Wildboy07@'); 