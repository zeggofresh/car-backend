import pool from './api/_db.js';

async function checkRequests() {
  console.log('Checking service_requests table...\n');
  
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'service_requests'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ service_requests table does not exist!');
      return;
    }
    
    console.log('✅ service_requests table exists\n');
    
    // Check total count
    const countRes = await pool.query('SELECT COUNT(*) FROM service_requests');
    console.log(`Total requests in database: ${countRes.rows[0].count}\n`);
    
    // Check columns
    const columnsRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'service_requests'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in service_requests:');
    columnsRes.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    console.log('');
    
    // Show sample data
    const sampleRes = await pool.query('SELECT * FROM service_requests LIMIT 5');
    if (sampleRes.rows.length > 0) {
      console.log('Sample requests:');
      sampleRes.rows.forEach((row, idx) => {
        console.log(`\n${idx + 1}. ID: ${row.id}`);
        console.log(`   Business ID: ${row.business_id}`);
        console.log(`   User ID: ${row.user_id}`);
        console.log(`   Service ID: ${row.service_id}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Created: ${row.created_at}`);
      });
    } else {
      console.log('⚠️  No requests found in the database!');
      console.log('\nThis means no customers have made any service requests yet.');
      console.log('To test, a customer needs to make a request via POST /api/customer/requests');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkRequests();
