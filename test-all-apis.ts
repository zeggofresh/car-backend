import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

// Test credentials
const TEST_USER = {
  phone: '9999999999',
  password: 'test123'
};

let authToken = '';

async function testAPIs() {
  console.log('🧪 Starting API Tests...\n');
  
  try {
    // 1. Test Login
    console.log('1️⃣  Testing Login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = loginRes.data.token;
    console.log('✅ Login successful\n');
    
    // 2. Test Public APIs
    console.log('2️⃣  Testing Public APIs...');
    const centersRes = await axios.get(`${BASE_URL}/public/centers`);
    console.log('✅ GET /public/centers - OK');
    
    const plansRes = await axios.get(`${BASE_URL}/public/plans`);
    console.log('✅ GET /public/plans - OK\n');
    
    // 3. Test Customer APIs (requires auth)
    console.log('3️⃣  Testing Customer APIs...');
    const headers = { Authorization: `Bearer ${authToken}` };
    
    const profileRes = await axios.get(`${BASE_URL}/customer/profile`, { headers });
    console.log('✅ GET /customer/profile - OK');
    
    const historyRes = await axios.get(`${BASE_URL}/customer/history`, { headers });
    console.log('✅ GET /customer/history - OK');
    
    const subscriptionRes = await axios.get(`${BASE_URL}/customer/subscription`, { headers });
    console.log('✅ GET /customer/subscription - OK');
    
    const plansCustomerRes = await axios.get(`${BASE_URL}/customer/plans`, { headers });
    console.log('✅ GET /customer/plans - OK');
    
    const giftCardsRes = await axios.get(`${BASE_URL}/customer/gift-cards`, { headers });
    console.log('✅ GET /customer/gift-cards - OK\n');
    
    // 4. Test Notifications
    console.log('4️⃣  Testing Notifications...');
    const notificationsRes = await axios.get(`${BASE_URL}/notifications`, { headers });
    console.log('✅ GET /notifications - OK\n');
    
    // 5. Test Admin APIs (will fail if not admin)
    console.log('5️⃣  Testing Admin APIs...');
    try {
      const adminRes = await axios.get(`${BASE_URL}/admin/dashboard`, { headers });
      console.log('✅ GET /admin/dashboard - OK (Admin access)\n');
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('⚠️  GET /admin/dashboard - Requires admin role (Expected)\n');
      } else {
        throw error;
      }
    }
    
    console.log('═══════════════════════════════════════');
    console.log('✅ All API tests completed successfully!');
    console.log('═══════════════════════════════════════\n');
    
  } catch (error: any) {
    console.error('\n❌ API Test Failed:');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

testAPIs();
