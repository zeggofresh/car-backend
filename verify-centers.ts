import pool from './api/_db.js';

async function verifyCenters() {
  try {
    console.log('Verifying approved centers with locations...\n');
    
    const result = await pool.query(`
      SELECT id, name, latitude, longitude, address, status 
      FROM businesses 
      WHERE status = 'approved' AND latitude IS NOT NULL
      ORDER BY created_at ASC
    `);
    
    console.log(`✅ Found ${result.rowCount} approved centers:\n`);
    
    result.rows.forEach((center, idx) => {
      console.log(`${idx + 1}. ${center.name}`);
      console.log(`   📍 Location: (${center.latitude}, ${center.longitude})`);
      console.log(`   📌 Address: ${center.address || 'N/A'}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

verifyCenters();
