import axios from 'axios';

async function testCentersAPI() {
  try {
    console.log('Testing Centers API...\n');
    
    // Test 1: Without location (all centers)
    console.log('📍 Test 1: Fetching ALL centers (without location)');
    const allResponse = await axios.get('http://localhost:3001/api/public/centers');
    console.log(`✅ Found ${allResponse.data.length} centers\n`);
    console.log('Response:', JSON.stringify(allResponse.data, null, 2));
    console.log('\n---\n');
    
    // Test 2: With Riyadh location
    console.log('📍 Test 2: Fetching NEAREST centers (with Riyadh location)');
    const riyadhLat = 24.7136;
    const riyadhLng = 46.6753;
    
    const nearestResponse = await axios.get(
      `http://localhost:3001/api/public/centers?lat=${riyadhLat}&lng=${riyadhLng}&mode=with_distances`
    );
    
    console.log(`✅ Found ${nearestResponse.data.length} nearest centers\n`);
    
    if (nearestResponse.data.length > 0) {
      console.log('📊 Centers sorted by distance:\n');
      nearestResponse.data.forEach((center: any, idx: number) => {
        console.log(`${idx + 1}. ${center.name}`);
        console.log(`   📍 Distance: ${center.distance_text || center.distance_km?.toFixed(2) + ' km' || 'N/A'}`);
        console.log(`   ⏱️ Duration: ${center.duration_text || 'N/A'}`);
        console.log(`   📌 Address: ${center.address || 'N/A'}`);
        console.log(`   🗺️ Coordinates: (${center.latitude}, ${center.longitude})`);
        console.log('');
      });
    } else {
      console.log('❌ No centers found with location data!');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

testCentersAPI();
