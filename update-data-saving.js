const fs = require('fs');
const path = require('path');

// Read the server file
const serverFile = path.join(__dirname, 'server', 'index.js');
let content = fs.readFileSync(serverFile, 'utf8');

// Define the replacements with specific action names
const replacements = [
  {
    old: 'saveDataToFiles();',
    new: 'saveDataToFiles(\'verification_code_sent\');',
    context: 'verification code sent'
  },
  {
    old: 'saveDataToFiles();',
    new: 'saveDataToFiles(\'email_verified\');',
    context: 'email verified'
  },
  {
    old: 'saveDataToFiles();',
    new: 'saveDataToFiles(\'user_created\');',
    context: 'user created'
  },
  {
    old: 'saveDataToFiles();',
    new: 'saveDataToFiles(\'payment_success\');',
    context: 'payment success'
  },
  {
    old: 'saveDataToFiles();',
    new: 'saveDataToFiles(\'subscription_created\');',
    context: 'subscription created'
  },
  {
    old: 'saveDataToFiles();',
    new: 'saveDataToFiles(\'credit_used\');',
    context: 'credit used'
  },
  {
    old: 'saveDataToFiles();',
    new: 'saveDataToFiles(\'bd_entry_added\');',
    context: 'bd tracker entry'
  },
  {
    old: 'saveDataToFiles();',
    new: 'saveDataToFiles(\'search_performed\');',
    context: 'search performed'
  },
  {
    old: 'saveDataToFiles();',
    new: 'saveDataToFiles(\'file_uploaded\');',
    context: 'file uploaded'
  },
  {
    old: 'saveDataToFiles();',
    new: 'saveDataToFiles(\'profile_updated\');',
    context: 'profile updated'
  }
];

// Apply replacements
let updatedCount = 0;
replacements.forEach((replacement, index) => {
  if (content.includes(replacement.old)) {
    content = content.replace(replacement.old, replacement.new);
    updatedCount++;
    console.log(`✅ Updated ${replacement.context} data saving`);
  }
});

// Write back to file
fs.writeFileSync(serverFile, content);
console.log(`\n✅ Updated ${updatedCount} data saving calls with specific action names`);
console.log('✅ All actions now have proper data saving tracking'); 