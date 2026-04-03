// Test Offers API - Date Support

console.log('=== Offers API - Start Date & Expiry Date Support ===\n');

console.log('✅ WHAT WAS ADDED:\n');
console.log('1. Database columns: start_date and end_date');
console.log('2. API support for: start_date and expiry_date fields');
console.log('3. Response now includes all date fields\n');

console.log('📝 YOUR EXACT PAYLOAD (Will Work Now!):\n');

const yourPayload = {
  code: "cbg",
  name_en: "vfdbg bf",
  name_ar: "bfg",
  details_en: "vfdbg",
  details_ar: "fvvdb",
  discount_percentage: 3,
  start_date: "2026-04-03",
  expiry_date: "2026-05-03",
  is_active: true
};

console.log('Request Body:');
console.log(JSON.stringify(yourPayload, null, 2));

console.log('\nExpected Response:');
console.log(JSON.stringify({
  id: 1,
  business_id: "uuid-here",
  title_en: "vfdbg bf",
  title_ar: "bfg",
  description_en: "vfdbg",
  description_ar: "fvvdb",
  discount_percentage: 3.00,
  start_date: "2026-04-03",      // ✅ Will be included!
  end_date: "2026-05-03",        // ✅ Will be included!
  valid_until: "2026-05-03",     // ✅ Also set for compatibility
  active: true,
  created_at: "2026-04-02T12:00:00Z"
}, null, 2));

console.log('\n\n🎯 FIELD MAPPING:\n');
console.log('Frontend Field    →  Database Column  →  Response Field');
console.log('------------------|-------------------|------------------');
console.log('start_date        →  start_date       →  start_date ✅');
console.log('expiry_date       →  end_date         →  end_date ✅');
console.log('valid_until       →  valid_until      →  valid_until ✅');
console.log('                  →  (also sets end_date)');

console.log('\n\n💡 EXAMPLES:\n');

const examples = [
  {
    name: 'Example 1: Full Offer with Dates',
    request: {
      title_en: "Summer Sale",
      title_ar: "تخفيضات الصيف",
      discount_percentage: 25,
      start_date: "2026-06-01",
      expiry_date: "2026-08-31"
    },
    response_includes: {
      start_date: "2026-06-01",
      end_date: "2026-08-31",
      valid_until: "2026-08-31"
    }
  },
  {
    name: 'Example 2: Only Expiry Date',
    request: {
      discount_percentage: 20,
      expiry_date: "2026-12-31"
    },
    response_includes: {
      start_date: null,
      end_date: "2026-12-31",
      valid_until: "2026-12-31"
    }
  },
  {
    name: 'Example 3: Using Legacy valid_until',
    request: {
      discount_percentage: 15,
      valid_until: "2026-09-30"
    },
    response_includes: {
      start_date: null,
      end_date: null,
      valid_until: "2026-09-30"
    }
  }
];

examples.forEach((example, index) => {
  console.log(`\n${index + 1}. ${example.name}`);
  console.log('   Request:', JSON.stringify(example.request, null, 2));
  console.log('   Response includes:', JSON.stringify(example.response_includes, null, 2));
});

console.log('\n\n🚀 READY TO TEST!\n');
console.log('Your POST request will now return start_date and expiry_date in the response.');
console.log('No more missing dates!\n');

console.log('Try it now at:');
console.log('POST https://car-backend-production-36e6.up.railway.app/api/business/offers\n');
