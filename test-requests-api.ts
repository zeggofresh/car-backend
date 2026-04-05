import axios from 'axios';

async function testRequestsAPI() {
  console.log('Testing /api/business/requests endpoint...\n');
  
  try {
    // Note: You need to replace this with a valid token
    const token = 'YOUR_AUTH_TOKEN_HERE';
    
    const response = await axios.get(
      'https://car-backend-production-36e6.up.railway.app/api/business/requests',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Status:', response.status);
    console.log('Total requests returned:', response.data.length);
    console.log('\nRequests:');
    console.log('─'.repeat(100));
    
    if (response.data.length === 0) {
      console.log('No requests found');
    } else {
      response.data.forEach((req: any, idx: number) => {
        console.log(`\n${idx + 1}. Request ID: ${req.id}`);
        console.log(`   Business: ${req.business_name || 'N/A'}`);
        console.log(`   Customer: ${req.customer_name || 'N/A'}`);
        console.log(`   Service: ${req.service_name || 'N/A'}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Price: ${req.price || 'N/A'}`);
        console.log(`   Date: ${req.request_date || 'N/A'}`);
        console.log(`   Time: ${req.request_time || 'N/A'}`);
        console.log(`   Created: ${new Date(req.created_at).toLocaleString()}`);
      });
    }
    
    console.log('\n✅ API is working correctly!');
    
  } catch (error: any) {
    console.error('❌ Error testing API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testRequestsAPI();
