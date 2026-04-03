// Quick test to verify centers API works for personal users
// Run this in browser console after logging in as personal user

console.log('=== Testing Centers API ===\n');

// Test 1: Check token
const token = localStorage.getItem('token');
console.log('1. Token check:', token ? '✅ Token exists' : '❌ No token');

if (token) {
  // Decode and show user info
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('   User:', {
      id: payload.id,
      phone: payload.phone,
      role: payload.role
    });
  } catch (e) {
    console.log('   Could not decode token');
  }
}

// Test 2: Fetch centers using proxy (CORRECT WAY)
console.log('\n2. Fetching centers via proxy (/api/public/centers)...');
fetch('/api/public/centers', {
  headers: {
    'accept': 'application/json',
    'authorization': token ? `Bearer ${token}` : undefined
  }
})
.then(res => {
  console.log('   Response status:', res.status);
  return res.json();
})
.then(data => {
  console.log('   Centers found:', Array.isArray(data) ? data.length : 'Not an array');
  if (Array.isArray(data) && data.length > 0) {
    console.log('   First center:', {
      name: data[0].name,
      status: data[0].status,
      latitude: data[0].latitude,
      longitude: data[0].longitude
    });
  } else {
    console.log('   ⚠️ No centers found or invalid response');
  }
})
.catch(err => {
  console.error('   ❌ Error:', err.message);
});

// Test 3: Fetch centers with location (if geolocation available)
console.log('\n3. Testing with location...');
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      console.log('   Location:', { lat, lng });
      
      fetch(`/api/public/centers?lat=${lat}&lng=${lng}&mode=with_distances`, {
        headers: {
          'authorization': token ? `Bearer ${token}` : undefined
        }
      })
      .then(res => res.json())
      .then(data => {
        console.log('   Nearest centers:', Array.isArray(data) ? data.length : 0);
        if (data.length > 0) {
          console.log('   Nearest:', {
            name: data[0].name,
            distance: data[0].distance_km || data[0].distance_text
          });
        }
      })
      .catch(err => console.error('   ❌ Error:', err.message));
    },
    (error) => {
      console.log('   ⚠️ Geolocation not available or denied');
    }
  );
} else {
  console.log('   ⚠️ Geolocation not supported');
}

console.log('\n=== Tests initiated ===');
console.log('Check the console output above for results...\n');
