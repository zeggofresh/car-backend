import pool from './api/_db.js';

async function createTestBusinesses() {
  try {
    console.log('Creating test businesses with different locations...\n');
    
    // Default password hash for all: "test123"
    const passwordHash = '$2a$10$rH9zqX8FQ7N.Pz3kGKZtqO1vY8wJ5vK3mL2nR4tS6uW7xY8zA9bC0';
    
    // Test businesses with coordinates around Riyadh
    const testBusinesses = [
      {
        name: 'Al Olaya Car Wash',
        phone: '9999999991',
        lat: 24.7136,  // Central Riyadh - VERY CLOSE to user
        lng: 46.6753,
        status: 'approved'
      },
      {
        name: 'Malaz Auto Spa',
        phone: '9999999992',
        lat: 24.7300,  // Slightly further
        lng: 46.7000,
        status: 'approved'
      },
      {
        name: 'Narjis Car Care',
        phone: '9999999993',
        lat: 24.7600,  // Even further
        lng: 46.6200,
        status: 'approved'
      },
      {
        name: 'Sahara Auto Detailing',
        phone: '9999999994',
        lat: 24.6800,  // South Riyadh - FARTHEST
        lng: 46.7200,
        status: 'approved'
      }
    ];
    
    for (const biz of testBusinesses) {
      // Check if already exists
      const existing = await pool.query(
        'SELECT id FROM businesses WHERE phone = $1',
        [biz.phone]
      );
      
      if (existing.rowCount === 0) {
        await pool.query(
          `INSERT INTO businesses (
            name, phone, password_hash, status, latitude, longitude,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [biz.name, biz.phone, passwordHash, biz.status, biz.lat, biz.lng]
        );
        console.log(`✅ Created "${biz.name}" at (${biz.lat}, ${biz.lng})`);
      } else {
        console.log(`⚠️  "${biz.name}" already exists, skipping...`);
      }
    }
    
    console.log('\n✨ All test businesses created!');
    console.log('\nExpected order (for user in central Riyadh):');
    console.log('1. Al Olaya Car Wash - CLOSEST (~0 km)');
    console.log('2. Malaz Auto Spa - ~3 km');
    console.log('3. Narjis Car Care - ~6 km');
    console.log('4. Sahara Auto Detailing - FARTHEST (~8 km)');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createTestBusinesses();
