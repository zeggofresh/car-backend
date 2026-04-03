import http from 'http';

const data = JSON.stringify({
  phone: '1234567899',
  password: 'test123',
  name: 'Node Test',
  role: 'customer'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Response:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.setTimeout(10000, () => {
  console.error('Request timeout');
  req.destroy();
  process.exit(1);
});

req.write(data);
req.end();

console.log('Sending request...');
