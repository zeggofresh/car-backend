import pool from './api/_db.js';

async function fixBusinessLocations() {
  try {
    console.log('Checking all businesses...');
    
    const result = await pool.query(
      'SELECT id, name, status, latitude, longitude FROM businesses'
    );
    
    console.log('\nAll businesses:');
    result.rows.forEach(b => {
      const hasLocation = b.latitude && b.longitude;
      console.log(`- ${b.name} | Status: ${b.status} | Location: ${hasLocation ? `${b.latitude}, ${b.longitude}` : 'MISSING ❌'}`);
    });
    
    // Update businesses with missing locations to default Riyadh coordinates
    const businessesToUpdate = result.rows.filter(b => !b.latitude || !b.longitude);
    
    if (businessesToUpdate.length > 0) {
      console.log(`\n⚠️ Found ${businessesToUpdate.length} business(es) without location data`);
      console.log('Updating with default Riyadh coordinates...\n');
      
      // Default Riyadh coordinates
      const RIYADH_LAT = 24.7136;
      const RIYADH_LNG = 46.6753;
      
      for (const biz of businessesToUpdate) {
        await pool.query(
          'UPDATE businesses SET latitude = $1, longitude = $2 WHERE id = $3',
          [RIYADH_LAT, RIYADH_LNG, biz.id]
        );
        console.log(`✅ Updated "${biz.name}" to Riyadh coordinates (${RIYADH_LAT}, ${RIYADH_LNG})`);
      }
      
      console.log('\n✨ All businesses now have location data!');
    } else {
      console.log('\n✅ All businesses have valid location data!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixBusinessLocations();
