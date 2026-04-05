import pool from './api/_db.js';

async function checkPendingRequests() {
  console.log('Checking pending requests...\n');
  
  try {
    // Check all requests by status
    const statusCount = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM service_requests
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('Requests by Status:');
    console.log('─'.repeat(60));
    statusCount.rows.forEach((row) => {
      console.log(`${row.status}: ${row.count} requests`);
    });
    console.log('');
    
    // Show all pending requests
    const pendingRes = await pool.query(`
      SELECT sr.*, u.name as customer_name, s.name_en as service_name, b.name as business_name
      FROM service_requests sr
      LEFT JOIN users u ON sr.user_id = u.id
      LEFT JOIN services s ON sr.service_id = s.id
      LEFT JOIN businesses b ON sr.business_id = b.id
      WHERE sr.status = 'pending'
      ORDER BY sr.created_at DESC
    `);
    
    console.log(`\nPending Requests: ${pendingRes.rows.length}`);
    console.log('─'.repeat(100));
    
    if (pendingRes.rows.length === 0) {
      console.log('No pending requests found');
    } else {
      pendingRes.rows.forEach((req, idx) => {
        console.log(`\n${idx + 1}. Request ID: ${req.id}`);
        console.log(`   Business: ${req.business_name || 'N/A'}`);
        console.log(`   Customer: ${req.customer_name || 'N/A'}`);
        console.log(`   Service: ${req.service_name || 'N/A'}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Price: ₹${req.price || 'N/A'}`);
        console.log(`   Date: ${req.request_date || 'N/A'}`);
        console.log(`   Time: ${req.request_time || 'N/A'}`);
        console.log(`   Created: ${new Date(req.created_at).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkPendingRequests();
