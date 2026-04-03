import pool from './api/_db.js';

async function checkServices() {
  console.log('=== Checking Services Data ===\n');
  
  try {
    // Check if services table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'services'
      );
    `);
    console.log('Services table exists:', tableCheck.rows[0].exists);
    
    // Count total services
    const countRes = await pool.query('SELECT COUNT(*) FROM services');
    console.log('Total services in database:', countRes.rows[0].count);
    
    // Get all services to see what's there
    const allServices = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
    console.log('\nAll services in database:');
    console.log(JSON.stringify(allServices.rows, null, 2));
    
    // Check businesses
    const businesses = await pool.query('SELECT id, name FROM businesses');
    console.log('\nBusinesses in database:');
    businesses.rows.forEach(biz => {
      console.log(`- ${biz.name} (ID: ${biz.id})`);
    });
    
    // Check services per business
    const servicesByBiz = await pool.query(`
      SELECT b.name as business_name, b.id as business_id, COUNT(s.id) as service_count
      FROM businesses b
      LEFT JOIN services s ON b.id = s.business_id
      GROUP BY b.id, b.name
      ORDER BY b.name;
    `);
    console.log('\nServices per business:');
    servicesByBiz.rows.forEach(row => {
      console.log(`- ${row.business_name}: ${row.service_count} services`);
    });
    
    // Sample service data
    if (allServices.rows.length > 0) {
      console.log('\nSample service data structure:');
      console.log(JSON.stringify(allServices.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error checking services:', error);
  } finally {
    await pool.end();
  }
}

checkServices();
