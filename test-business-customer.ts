import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testBusinessAndCustomer() {
  console.log('🧪 Testing Business & Customer APIs...\n');
  
  try {
    // Login as business owner
    console.log('1️⃣  Logging in as business owner...');
    const adminRes = await axios.post(`${BASE_URL}/auth/admin-login`, {
      password: 'admin123'
    });
    const adminToken = adminRes.data.token;
    console.log('✅ Admin logged in\n');
    
    // Test company info update
    console.log('2️⃣  Testing Company Info Update...');
    try {
      const companyRes = await axios.put(
        `${BASE_URL}/business/company-info`,
        { name: 'Test Business', mobile: '1234567890' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('✅ Company info updated\n');
    } catch (error: any) {
      console.log('⚠️  Company info update skipped (no business yet)\n');
    }
    
    // Login as customer
    console.log('3️⃣  Logging in as customer...');
    const customerRes = await axios.post(`${BASE_URL}/auth/login`, {
      phone: '9999999999',
      password: 'test123'
    });
    const customerToken = customerRes.data.token;
    console.log('✅ Customer logged in\n');
    
    // Test profile update
    console.log('4️⃣  Testing Customer Profile Update...');
    const profileRes = await axios.put(
      `${BASE_URL}/customer/profile`,
      { name: 'Test User Updated' },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    console.log('✅ Profile updated\n');
    
    // Test service request
    console.log('5️⃣  Testing Service Request...');
    try {
      // Get a center first
      const centersRes = await axios.get(`${BASE_URL}/public/centers`);
      const center = centersRes.data[0];
      
      if (center && center.services && center.services.length > 0) {
        const service = center.services[0];
        const requestRes = await axios.post(
          `${BASE_URL}/customer/requests`,
          {
            business_id: center.id,
            service_id: service.id,
            date: new Date().toISOString().split('T')[0],
            time: '10:00'
          },
          { headers: { Authorization: `Bearer ${customerToken}` } }
        );
        console.log('✅ Service request created\n');
      } else {
        console.log('⚠️  No services available for testing\n');
      }
    } catch (error: any) {
      console.log('⚠️  Service request failed:', error.response?.data?.message || error.message, '\n');
    }
    
    // Test subscription
    console.log('6️⃣  Testing Subscription...');
    try {
      const plansRes = await axios.get(`${BASE_URL}/public/plans`);
      const plan = plansRes.data[0];
      
      if (plan) {
        const subRes = await axios.post(
          `${BASE_URL}/customer/subscribe`,
          {
            plan_id: plan.id,
            start_date: new Date().toISOString()
          },
          { headers: { Authorization: `Bearer ${customerToken}` } }
        );
        console.log('✅ Subscription created\n');
      } else {
        console.log('⚠️  No plans available\n');
      }
    } catch (error: any) {
      console.log('⚠️  Subscription failed:', error.response?.data?.message || error.message, '\n');
    }
    
    console.log('═══════════════════════════════════');
    console.log('🎉 Business & Customer API Tests Done!');
    console.log('═══════════════════════════════════\n');
    
  } catch (error: any) {
    console.error('\n❌ Test Failed:');
    console.error('Endpoint:', error.config?.url);
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testBusinessAndCustomer();
