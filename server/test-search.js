const fs = require('fs');

// Load the data
const data = JSON.parse(fs.readFileSync('data/biotechData.json', 'utf8'));

console.log('Total records:', data.length);

// Test "fan" search
const fanResults = data.filter(item => 
  item.contactPerson && 
  item.contactPerson.toLowerCase().includes('fan')
);

console.log('\n=== FAN SEARCH RESULTS ===');
console.log('Number of results:', fanResults.length);

if (fanResults.length > 0) {
  console.log('\nSample results:');
  fanResults.slice(0, 5).forEach((result, index) => {
    console.log(`${index + 1}. ${result.contactPerson} - ${result.companyName}`);
  });
} else {
  console.log('No results found for "fan"');
}

// Test company search
const companyResults = data.filter(item => 
  item.companyName && 
  item.companyName.toLowerCase().includes('pfizer')
);

console.log('\n=== PFIZER SEARCH RESULTS ===');
console.log('Number of results:', companyResults.length);

if (companyResults.length > 0) {
  console.log('\nSample results:');
  companyResults.slice(0, 5).forEach((result, index) => {
    console.log(`${index + 1}. ${result.contactPerson} - ${result.companyName}`);
  });
} 