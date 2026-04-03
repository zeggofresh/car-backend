import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function quickTest() {
  console.log('🔍 Quick API Health Check\n');
  
  try {
    // Test 1: Public endpoints
    console.log('✅ Testing Public Endpoints...');
    await axios.get(`${BASE_URL}/public/centers`);
    console.log('   ✓ /api/public/centers');
    
    await axios.get(`${BASE_URL}/public/plans`);
    console.log('   ✓ /api/public/plans\n');
    
    // Test 2: Admin Login
    console.log('✅ Testing Admin Login...');
    const adminRes = await axios.post(`${BASE_URL}/auth/admin-login`, {
      password: 'admin123'
    });
    const adminToken = adminRes.data.token;
    console.log('   ✓ Admin login successful\n');
    
    // Test 3: Customer Login
    console.log('✅ Testing Customer Login...');
    const customerRes = await axios.post(`${BASE_URL}/auth/login`, {
      phone: '9999999999',
      password: 'test123'
    });
    const customerToken = customerRes.data.token;
    console.log('   ✓ Customer login successful\n');
    
    // Test 4: Admin endpoints with admin token
    console.log('✅ Testing Admin Endpoints (with admin token)...');
    const headers = { Authorization: `Bearer ${adminToken}` };
    
    await axios.get(`${BASE_URL}/admin/dashboard`, { headers });
    console.log('   ✓ /api/admin/dashboard');
    
    await axios.get(`${BASE_URL}/admin/financial-analysis`, { headers });
    console.log('   ✓ /api/admin/financial-analysis\n');
    
    // Test 5: Customer endpoints
    console.log('✅ Testing Customer Endpoints...');
    const cHeaders = { Authorization: `Bearer ${customerToken}` };
    
    await axios.get(`${BASE_URL}/customer/profile`, { headers: cHeaders });
    console.log('   ✓ /api/customer/profile');
    
    await axios.get(`${BASE_URL}/customer/history`, { headers: cHeaders });
    console.log('   ✓ /api/customer/history');
    
    await axios.get(`${BASE_URL}/notifications`, { headers: cHeaders });
    console.log('   ✓ /api/notifications\n');
    
    console.log('═══════════════════════════════════');
    console.log('🎉 ALL APIS ARE WORKING!');
    console.log('═══════════════════════════════════\n');
    
  } catch (error: any) {
    console.error('\n❌ API Test Failed:');
    console.error('Endpoint:', error.config?.url);
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

quickTest();
