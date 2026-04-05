import pool from './api/_db.js';

async function checkBusinessRequests() {
  console.log('Checking requests by business...\n');
  
  try {
    const result = await pool.query(`
      SELECT 
        sr.business_id,
        b.name as business_name,
        COUNT(*) as request_count
      FROM service_requests sr
      LEFT JOIN businesses b ON sr.business_id = b.id
      GROUP BY sr.business_id, b.name
      ORDER BY request_count DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('No requests found');
      return;
    }
    
    console.log('Requests by Business:');
    console.log('─'.repeat(80));
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. Business ID: ${row.business_id}`);
      console.log(`   Name: ${row.business_name || 'N/A'}`);
      console.log(`   Requests: ${row.request_count}`);
      console.log('');
    });
    
    console.log('\nTo see requests for a specific business, use that business_id in your API call.');
    console.log('Make sure your auth token is associated with one of these business IDs.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkBusinessRequests();
