import axios from 'axios';

async function testGoogleMapsAPI() {
  try {
    console.log('🗺️ Testing Google Maps Distance Matrix API...\n');
    
    const GOOGLE_MAPS_KEY = 'AIzaSyCPQQJOJUYfHWW7NJNoFazbbDI07mmz3No';
    
    // Test coordinates (Riyadh)
    const origin = '24.7136,46.6753'; // User location (central Riyadh)
    const destinations = [
      '24.7136,46.6753', // Al Olaya (same as origin - should be ~0 km)
      '24.7300,46.7000', // Malaz (~3 km)
      '24.7600,46.6200'  // Narjis (~7 km)
    ].join('|');
    
    console.log('Origin:', origin);
    console.log('Destinations:', destinations);
    console.log('\nCalling Google Maps Distance Matrix API...\n');
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json`,
      {
        params: {
          origins: origin,
          destinations: destinations,
          key: GOOGLE_MAPS_KEY,
          mode: 'driving'
        }
      }
    );
    
    console.log('✅ API Response Status:', response.data.status);
    console.log('\n📊 Results:\n');
    
    if (response.data.status === 'OK') {
      const elements = response.data.rows[0]?.elements || [];
      
      const destinationNames = [
        'Al Olaya Car Wash',
        'Malaz Auto Spa',
        'Narjis Premium Car Care'
      ];
      
      elements.forEach((element: any, idx: number) => {
        if (element.status === 'OK') {
          console.log(`${idx + 1}. ${destinationNames[idx]}`);
          console.log(`   📍 Distance: ${element.distance.text}`);
          console.log(`   ⏱️ Duration: ${element.duration.text}`);
          console.log(`   📐 Exact: ${element.distance.value} meters, ${element.duration.value} seconds`);
          console.log('');
        } else {
          console.log(`${idx + 1}. ${destinationNames[idx]} - No route found`);
          console.log('');
        }
      });
      
      console.log('✨ Google Maps API is working perfectly!\n');
    } else {
      console.error('❌ API Error:', response.data.status);
      console.error('Error Message:', response.data.error_message);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

testGoogleMapsAPI();
