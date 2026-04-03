import bcrypt from 'bcryptjs';
import pool from './api/_db.js';

async function testLogin() {
  try {
    console.log('Testing database connection and user lookup...');
    
    // Check if any users exist
    const result = await pool.query('SELECT phone, name, role, password_hash FROM users LIMIT 5');
    console.log('\n=== Existing Users ===');
    result.rows.forEach(user => {
      console.log(`Phone: ${user.phone}, Name: ${user.name}, Role: ${user.role}`);
    });
    
    if (result.rows.length > 0) {
      const testUser = result.rows[0];
      console.log('\n=== Testing Password Comparison ===');
      console.log('Try logging in with:');
      console.log(`Phone: ${testUser.phone}`);
      console.log('Password: (you need to remember what you registered with)');
      
      // Test bcrypt comparison
      const testPassword = 'test123';
      const isMatch = await bcrypt.compare(testPassword, testUser.password_hash);
      console.log(`\nTest password 'test123' matches: ${isMatch}`);
    } else {
      console.log('No users found in database. Please register first.');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testLogin();
