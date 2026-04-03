// Sample Services Data for Testing
// Use this data to populate your services via POST /api/business/services

const sampleServices = [
  {
    name_en: "Full Wash",
    name_ar: "غسيل كامل",
    type: "Full",
    price_small: 30,
    price_medium: 40,
    price_suv: 50,
    active: true
  },
  {
    name_en: "Exterior Only",
    name_ar: "غسيل خارجي فقط",
    type: "Exterior",
    price_small: 20,
    price_medium: 25,
    price_suv: 30,
    active: true
  },
  {
    name_en: "Interior Detailing",
    name_ar: "تنظيف داخلي مفصل",
    type: "Interior",
    price_small: 40,
    price_medium: 50,
    price_suv: 60,
    active: true
  },
  {
    name_en: "Premium Full Detailing",
    name_ar: "تنفيس كامل ممتاز",
    type: "Full Detailing",
    price_small: 150,
    price_medium: 180,
    price_suv: 220,
    active: true
  },
  {
    name_en: "Quick Wash",
    name_ar: "غسيل سريع",
    type: "Exterior",
    price_small: 15,
    price_medium: 18,
    price_suv: 22,
    active: true
  },
  {
    name_en: "Deluxe Package",
    name_ar: "باقة ديلوكس",
    type: "Full",
    price_small: 60,
    price_medium: 75,
    price_suv: 90,
    active: true
  }
];

console.log('=== Sample Services Data ===\n');
console.log('Use these samples to create services for your business:\n');

sampleServices.forEach((service, index) => {
  console.log(`${index + 1}. ${service.name_en} (${service.type})`);
  console.log(`   English: ${service.name_en}`);
  console.log(`   Arabic: ${service.name_ar}`);
  console.log(`   Prices: Small=${service.price_small}, Medium=${service.price_medium}, SUV=${service.price_suv}`);
  console.log('');
});

console.log('\nHow to use:');
console.log('-----------');
console.log('Copy any service object above and send POST request to:');
console.log('POST /api/business/services\n');
console.log('Headers:');
console.log('  Authorization: Bearer YOUR_TOKEN');
console.log('  Content-Type: application/json\n');
console.log('Body: (paste the JSON object)\n');

console.log('Example - Creating first service:');
console.log(JSON.stringify(sampleServices[0], null, 2));
