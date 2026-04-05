// Simple test to check if API returns data
const https = require('https');

console.log('Testing API endpoint...\n');

const options = {
  hostname: 'car-backend-production-36e6.up.railway.app',
  path: '/api/business/requests',
  method: 'GET',
  headers: {
    // Add your auth token here
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}\n`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log(`Response: ${JSON.stringify(jsonData, null, 2)}`);
      console.log(`\nTotal requests returned: ${jsonData.length}`);
      
      if (jsonData.length === 0) {
        console.log('\n⚠️  API returned empty array!');
        console.log('Possible reasons:');
        console.log('1. Invalid or missing auth token');
        console.log('2. Token is not associated with any business');
        console.log('3. API filtering by business_id (but we removed that)');
      } else {
        console.log('\n✅ API is working correctly!');
        jsonData.forEach((req, idx) => {
          console.log(`${idx + 1}. ${req.business_name} - ${req.customer_name} - ${req.status}`);
        });
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();
