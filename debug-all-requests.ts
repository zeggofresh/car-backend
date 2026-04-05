import pool from './api/_db.js';

async function checkAllRequests() {
  console.log('=== Checking All Service Requests ===\n');
  
  try {
    // Check total count
    const totalRes = await pool.query('SELECT COUNT(*) FROM service_requests');
    console.log(`Total requests in database: ${totalRes.rows[0].count}\n`);
    
    // Check by status
    const statusRes = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM service_requests
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('Requests by Status:');
    console.log('─'.repeat(60));
    statusRes.rows.forEach((row) => {
      console.log(`  ${row.status.padEnd(15)} : ${row.count} requests`);
    });
    console.log('');
    
    // Show ALL requests with details
    const allRes = await pool.query(`
      SELECT 
        sr.id,
        sr.status,
        sr.price,
        sr.request_date,
        sr.request_time,
        u.name as customer_name,
        u.phone as customer_phone,
        s.name_en as service_name,
        b.name as business_name,
        sr.created_at
      FROM service_requests sr
      LEFT JOIN users u ON sr.user_id = u.id
      LEFT JOIN services s ON sr.service_id = s.id
      LEFT JOIN businesses b ON sr.business_id = b.id
      ORDER BY sr.created_at DESC
    `);
    
    console.log(`\nAll Requests (${allRes.rows.length}):`);
    console.log('═'.repeat(100));
    
    if (allRes.rows.length === 0) {
      console.log('❌ NO REQUESTS FOUND IN DATABASE!');
      console.log('\nYou need to create test requests first.');
    } else {
      allRes.rows.forEach((req, idx) => {
        console.log(`\n${idx + 1}. ID: ${req.id.substring(0, 8)}...`);
        console.log(`   Status:       ${req.status}`);
        console.log(`   Business:     ${req.business_name || 'N/A'}`);
        console.log(`   Customer:     ${req.customer_name || 'N/A'} (${req.customer_phone || 'N/A'})`);
        console.log(`   Service:      ${req.service_name || 'N/A'}`);
        console.log(`   Price:        ₹${req.price || 'N/A'}`);
        console.log(`   Date/Time:    ${req.request_date || 'N/A'} ${req.request_time || ''}`);
        console.log(`   Created:      ${new Date(req.created_at).toLocaleString('en-IN')}`);
      });
    }
    
    console.log('\n' + '═'.repeat(100));
    console.log('\n✅ Database check complete!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
  } finally {
    await pool.end();
  }
}

checkAllRequests();
