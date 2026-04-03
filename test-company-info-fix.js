// Test Company Info Update API
// This demonstrates the fixed API endpoint

console.log('=== Company Info API - Test Guide ===\n');

const testCases = [
  {
    name: 'Test 1: Your Original Request',
    description: 'This is the exact request that was failing before',
    data: {
      allow_bookings: true,
      cr_number: "v fggf",
      images: [],
      logo: "",
      map_link: "https://railway.com/project/ae929d4f-1c24-4670-b084-a337407233d6/service/b7cd1dfb-a56d-4890-9f51-8baaa2409b89?environmentId=435b45e3-2b3a-4414-99be-1f7f963cedda&id=69de1193-2a33-4569-97eb-dc0922081a51&permalink=2026-04-01T10%3A40%3A26.054931749Z#deploy",
      mobile: "852852095620",
      name: "The Dessert Bar",
      tax_number: "fhty",
      working_hours: ""
    }
  },
  {
    name: 'Test 2: Complete Business Profile',
    description: 'Update all fields at once',
    data: {
      name: "Premium Car Wash & Detailing",
      phone: "920012345",
      mobile: "0501234567",
      tax_number: "300123456700003",
      cr_number: "1010101010",
      map_link: "https://maps.google.com/?q=24.7136,46.6753",
      logo: "https://example.com/logo.png",
      images: [
        "https://example.com/gallery/1.jpg",
        "https://example.com/gallery/2.jpg"
      ],
      working_hours: "Saturday-Thursday: 08:00-22:00, Friday: 14:00-22:00",
      allow_bookings: true,
      booking_settings: {
        maxBookingsPerDay: 20,
        advanceBookingDays: 7,
        cancellationPolicy: "24 hours notice required"
      }
    }
  },
  {
    name: 'Test 3: Quick Update (Just Name & Mobile)',
    description: 'Update only specific fields',
    data: {
      name: "Al Olaya Auto Spa",
      mobile: "0551234567"
    }
  },
  {
    name: 'Test 4: Location & Maps',
    description: 'Update location information',
    data: {
      map_link: "https://waze.com/ul/h2u3g4v5r6",
      working_hours: "Daily: 07:00 - 23:00"
    }
  },
  {
    name: 'Test 5: Booking Configuration',
    description: 'Enable bookings with settings',
    data: {
      allow_bookings: true,
      booking_settings: {
        enableOnlinePayment: true,
        requireDeposit: false,
        minNoticeHours: 2,
        maxAdvanceBookingDays: 30
      }
    }
  }
];

testCases.forEach((test, index) => {
  console.log(`\n${test.name}`);
  console.log('='.repeat(50));
  console.log(test.description);
  console.log('\nRequest:');
  console.log(JSON.stringify(test.data, null, 2));
  
  console.log('\ncURL Example:');
  console.log(`curl -X PUT \\`);
  console.log(`  -H "Authorization: Bearer YOUR_TOKEN" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '${JSON.stringify(test.data)}' \\`);
  console.log(`  https://car-backend-production-36e6.up.railway.app/api/business/company-info`);
  
  console.log('\nJavaScript Example:');
  console.log(`
  const response = await fetch('/api/business/company-info', {
    method: 'PUT',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(${JSON.stringify(test.data, null, 2).split('\n').map((line, i) => i === 0 ? line : '    ' + line).join('\n')})
  });
  
  const result = await response.json();
  console.log(result);
  `);
});

console.log('\n\n✅ WHAT WAS FIXED:');
console.log('==================');
console.log('✓ Added missing columns: map_link, logo, images, booking_settings, allow_bookings, mobile');
console.log('✓ Updated opening_hours to VARCHAR(500) for longer values');
console.log('✓ Support for working_hours → maps to opening_hours');
console.log('✓ Support for cr_number → maps to commercial_registration');
console.log('✓ Proper JSON serialization for images and booking_settings');
console.log('✓ Enhanced error logging with detailed messages');
console.log('✓ All database migrations applied successfully');

console.log('\n📋 SUPPORTED FIELDS:');
console.log('====================');
const supportedFields = [
  'name', 'phone', 'mobile', 'tax_number', 
  'cr_number (alias for commercial_registration)',
  'commercial_registration', 'map_link', 'logo', 
  'images (array)', 'working_hours (alias for opening_hours)',
  'opening_hours', 'allow_bookings', 'booking_settings (object)'
];
supportedFields.forEach(field => console.log(`  ✓ ${field}`));

console.log('\n🎯 EXPECTED RESPONSE:');
console.log('=====================');
console.log('Status: 200 OK');
console.log('Body: Updated business object with all fields\n');

console.log('Example Response:');
console.log(JSON.stringify({
  id: "uuid-here",
  name: "The Dessert Bar",
  mobile: "852852095620",
  tax_number: "fhty",
  commercial_registration: "v fggf",
  map_link: "https://railway.com/...",
  logo: "",
  images: [],
  opening_hours: "",
  allow_bookings: true,
  booking_settings: null,
  status: "approved"
}, null, 2));

console.log('\n\n🚀 READY TO TEST!');
console.log('Your original request should work now.');
console.log('No more "Server error" message!\n');
