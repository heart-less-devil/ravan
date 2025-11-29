const fs = require('fs');
const path = require('path');

// Load backup data
const backupPath = path.join(__dirname, 'backups', 'backup-1753321065994.json');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Load current users data
const usersPath = path.join(__dirname, 'data', 'users.json');
const currentUsers = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

console.log('🔧 RESTORING ORIGINAL PASSWORD HASHES FROM BACKUP...\n');

// Map of original password hashes from backup
const originalHashes = {
  'amankk0007@gmail.com': '$2a$10$XOkdxOW4k/pS2v1vVF.NGu7oD26rHntHFURoJWWPov1Rx7cjEe1Va',
  'charusharma3261@gmail.com': '$2a$10$HDzNM06iCwl0Ve2eQdY4i.3BYjxtWokElrHfFopQpfN8JlOeZ.p5q',
  'audiostock9@gmail.com': '$2a$10$TVZHp0Mnz1/ccT/Ksc1QfOIzs8fSMjF/o4TTkhupfwgJeskRmLEFy',
  'universalx0242@gmail.com': '$2a$10$20TtHYxGnnAA1EcZoXq06u2faT68sDulbmnMEJMyg.kRZBh6cicmS',
  'admin@bioping.com': '$2a$10$20TtHYxGnnAA1EcZoXq06u2faT68sDulbmnMEJMyg.kRZBh6cicmS',
  'demo@bioping.com': '$2a$10$20TtHYxGnnAA1EcZoXq06u2faT68sDulbmnMEJMyg.kRZBh6cicmS',
  'test@bioping.com': '$2a$10$20TtHYxGnnAA1EcZoXq06u2faT68sDulbmnMEJMyg.kRZBh6cicmS'
};

console.log('📋 ORIGINAL PASSWORD HASHES FROM BACKUP:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

currentUsers.forEach((user, index) => {
  const originalHash = originalHashes[user.email];
  
  if (originalHash) {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Original Hash: ${originalHash}`);
    
    // Restore the original hash
    user.password = originalHash;
    
    console.log(`   ✅ Restored original hash`);
  } else {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   ⚠️  No backup found - keeping current hash`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Save updated users
fs.writeFileSync(usersPath, JSON.stringify(currentUsers, null, 2));

console.log('\n🎉 ORIGINAL PASSWORD HASHES RESTORED!');
console.log('\n📋 TEST THESE PASSWORDS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. amankk0007@gmail.com - Try: Wildboy07@, password123, test123');
console.log('2. charusharma3261@gmail.com - Try: Wildboy07@, password123, test123');
console.log('3. audiostock9@gmail.com - Try: Wildboy07@, password123, test123');
console.log('4. universalx0242@gmail.com - Try: Wildboy07@, password123, test123');
console.log('5. admin@bioping.com - Try: Wildboy07@, password123, test123');
console.log('6. demo@bioping.com - Try: Wildboy07@, password123, test123');
console.log('7. test@bioping.com - Try: Wildboy07@, password123, test123');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n🚀 Test these passwords to find the original ones!'); 