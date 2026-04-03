import pool from './api/_db.js';

async function checkBusinesses() {
  try {
    console.log('Checking businesses in database...');
    
    // Check total businesses
    const allBiz = await pool.query('SELECT COUNT(*) FROM businesses');
    console.log('Total businesses:', allBiz.rows[0].count);
    
    // Check approved businesses
    const approvedBiz = await pool.query(
      'SELECT id, name, latitude, longitude, status FROM businesses WHERE status = $1',
      ['approved']
    );
    console.log('Approved businesses:', approvedBiz.rowCount);
    
    if (approvedBiz.rowCount === 0) {
      console.log('\n⚠️ NO APPROVED BUSINESSES FOUND!');
      console.log('This is why centers page is empty.');
      
      // Show all businesses with their status
      const all = await pool.query('SELECT id, name, status FROM businesses');
      console.log('\nAll businesses:');
      all.rows.forEach(b => {
        console.log(`- ${b.name} (status: ${b.status})`);
      });
    } else {
      console.log('\n✅ Approved businesses found:');
      approvedBiz.rows.forEach(b => {
        console.log(`- ${b.name} (${b.latitude}, ${b.longitude})`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkBusinesses();
