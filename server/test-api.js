const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API...');
    
    const response = await fetch('http://localhost:3005/api/search-biotech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        searchType: 'Contact Name',
        searchQuery: 'fan'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const result = await response.text();
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI(); 