const https = require('https');
const http = require('http');

const data = JSON.stringify({
  searchType: 'Contact Name',
  searchQuery: 'fan'
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/search-biotech',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:');
    console.log(body);
    try {
      const parsed = JSON.parse(body);
      console.log('Parsed response:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end(); 