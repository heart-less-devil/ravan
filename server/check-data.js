const fs = require('fs');

// Load the data
const data = JSON.parse(fs.readFileSync('data/biotechData.json', 'utf8'));

console.log('=== SEARCH DATA ANALYSIS ===');
console.log('Total records:', data.length);

// Check TA1 Oncology records
const ta1Records = data.filter(r => r.ta1_oncology === 1 || r.ta1_oncology === '1');
console.log('Records with TA1 oncology:', ta1Records.length);

// Check Large Pharma records
const largePharmaRecords = data.filter(r => r.tier && r.tier.toLowerCase().includes('large pharma'));
console.log('Records with Large Pharma tier:', largePharmaRecords.length);

// Check records with BOTH conditions
const bothConditions = data.filter(r => 
  (r.ta1_oncology === 1 || r.ta1_oncology === '1') && 
  r.tier && 
  r.tier.toLowerCase().includes('large pharma')
);
console.log('Records with BOTH conditions:', bothConditions.length);

console.log('\n=== SAMPLE MATCHING RECORDS ===');
bothConditions.slice(0, 5).forEach((r, i) => {
  console.log(`${i+1}. ${r.companyName} - ${r.contactPerson} - TA1: ${r.ta1_oncology} - Tier: ${r.tier}`);
});

console.log('\n=== VERIFICATION ===');
console.log('Expected results: 238');
console.log('Actual results:', bothConditions.length);
console.log('Difference:', 238 - bothConditions.length); 