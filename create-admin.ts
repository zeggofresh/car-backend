import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAdminUser() {
  try {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if admin already exists
    const checkRes = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
    
    if (checkRes.rows.length > 0) {
      console.log('✅ Super Admin already exists!');
      console.log('Admin ID:', checkRes.rows[0].id);
      console.log('\n📝 Login credentials:');
      console.log('   Phone: admin');
      console.log('   Password:', ADMIN_PASSWORD);
      console.log('   URL: http://localhost:3000/admin/login\n');
      await pool.end();
      return;
    }
    
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);
    
    const result = await pool.query(
      `INSERT INTO users (phone, name, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, phone, name, role`,
      ['admin', 'Super Admin', hash, 'super_admin']
    );
    
    console.log('✅ Super Admin created successfully!\n');
    console.log('📝 Login credentials:');
    console.log('   Phone: admin');
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   URL: http://localhost:3000/admin/login\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdminUser();
