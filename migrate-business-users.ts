import pool from './api/_db.js';

async function fixBusinessUsersTable() {
  console.log('Checking and fixing business_users table...\n');
  
  try {
    // Check if business_users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'business_users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ business_users table does not exist!');
      console.log('Creating business_users table...\n');
      
      await pool.query(`
        CREATE TABLE business_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id UUID REFERENCES businesses(id),
          name VARCHAR(255),
          username VARCHAR(255) UNIQUE,
          phone VARCHAR(20),
          password TEXT,
          account_type VARCHAR(50) DEFAULT 'staff',
          branch_ids JSONB,
          permissions JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log('✅ business_users table created successfully!\n');
    } else {
      console.log('✅ business_users table exists');
      
      // Check current columns
      const columnsRes = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'business_users'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nCurrent columns in business_users:');
      columnsRes.rows.forEach(row => {
        console.log(`  ${row.column_name} (${row.data_type})`);
      });
      
      // Add missing columns if needed
      const columnNames = columnsRes.rows.map(r => r.column_name);
      
      if (!columnNames.includes('name')) {
        await pool.query(`ALTER TABLE business_users ADD COLUMN name VARCHAR(255);`);
        console.log('✓ Added name column');
      }
      
      if (!columnNames.includes('username')) {
        await pool.query(`ALTER TABLE business_users ADD COLUMN username VARCHAR(255);`);
        console.log('✓ Added username column');
      }
      
      if (!columnNames.includes('phone')) {
        await pool.query(`ALTER TABLE business_users ADD COLUMN phone VARCHAR(20);`);
        console.log('✓ Added phone column');
      }
      
      if (!columnNames.includes('password')) {
        await pool.query(`ALTER TABLE business_users ADD COLUMN password TEXT;`);
        console.log('✓ Added password column');
      }
      
      if (!columnNames.includes('account_type')) {
        await pool.query(`ALTER TABLE business_users ADD COLUMN account_type VARCHAR(50) DEFAULT 'staff';`);
        console.log('✓ Added account_type column');
      }
      
      if (!columnNames.includes('branch_ids')) {
        await pool.query(`ALTER TABLE business_users ADD COLUMN branch_ids JSONB;`);
        console.log('✓ Added branch_ids column');
      }
      
      if (!columnNames.includes('permissions')) {
        await pool.query(`ALTER TABLE business_users ADD COLUMN permissions JSONB;`);
        console.log('✓ Added permissions column');
      }
      
      console.log('\n✅ business_users table structure verified!\n');
    }
    
  } catch (error) {
    console.error('Error fixing business_users table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixBusinessUsersTable();
