import bcrypt from 'bcryptjs';
import pool from './api/_db.js';

async function createTestUser() {
  try {
    const phone = '9999999999';
    const password = 'test123';
    const name = 'Test User';
    
    console.log('Creating test user...');
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);
    
    // Check if user exists
    const check = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (check.rows.length > 0) {
      console.log('User already exists. Updating password...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      await pool.query('UPDATE users SET password_hash = $1 WHERE phone = $2', [hash, phone]);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      
      await pool.query(
        'INSERT INTO users (phone, name, password_hash, role) VALUES ($1, $2, $3, $4)',
        [phone, name, hash, 'customer']
      );
    }
    
    console.log('\n✅ Test user created successfully!');
    console.log('\nYou can now login with:');
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
