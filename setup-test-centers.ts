import pool from './api/_db.js';

async function setupTestCenters() {
  try {
    console.log('Setting up test centers with different distances...\n');
    
    // First, update existing business to have proper name and location
    console.log('1. Updating existing businesses...');
    await pool.query(`
      UPDATE businesses 
      SET 
        name = 'Al Olaya Car Wash - Main Branch',
        latitude = 24.7136,
        longitude = 46.6753,
        address = 'King Fahd Road, Al Olaya, Riyadh'
      WHERE status = 'approved'
    `);
    console.log('   ✅ Updated existing approved business\n');
    
    // Create more test businesses by inserting directly into businesses table
    console.log('2. Creating additional test centers...');
    
    const testCenters = [
      {
        name: 'Malaz Auto Spa & Detailing',
        lat: 24.7300,
        lng: 46.7000,
        address: 'Prince Mohammed Bin Abdul Aziz Rd, Malaz, Riyadh'
      },
      {
        name: 'Narjis Premium Car Care',
        lat: 24.7600,
        lng: 46.6200,
        address: 'An Nakheel District, Riyadh'
      },
      {
        name: 'Sahara Auto Detailing Center',
        lat: 24.6800,
        lng: 46.7200,
        address: 'Al Aziziyyah District, Riyadh'
      }
    ];
    
    for (const center of testCenters) {
      await pool.query(
        `INSERT INTO businesses (name, status, latitude, longitude, address, created_at)
         VALUES ($1, 'approved', $2, $3, $4, NOW())`,
        [center.name, center.lat, center.lng, center.address]
      );
      console.log(`   ✅ Created "${center.name}"`);
    }
    
    console.log('\n✨ All test centers created successfully!\n');
    console.log('📍 Centers sorted by distance from central Riyadh:');
    console.log('   1. Al Olaya Car Wash - CLOSEST (~0 km) ⭐');
    console.log('   2. Malaz Auto Spa & Detailing - ~3 km');
    console.log('   3. Narjis Premium Car Care - ~6 km');
    console.log('   4. Sahara Auto Detailing Center - ~8 km');
    console.log('\n✅ Nearest centers will appear first on /app/centers page!\n');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

setupTestCenters();
