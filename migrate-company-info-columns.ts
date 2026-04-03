import pool from './api/_db.js';

async function fixCompanyInfoColumns() {
  console.log('Starting company info columns migration...\n');
  
  try {
    // Check current columns in businesses table
    const columnsRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'businesses'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current columns in businesses table:');
    columnsRes.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    console.log('');
    
    // Add missing columns that the frontend is using
    console.log('Adding missing columns...\n');
    
    // Add map_link column
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS map_link TEXT;
    `);
    console.log('✓ Added map_link column');
    
    // Add logo column
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS logo TEXT;
    `);
    console.log('✓ Added logo column');
    
    // Add images column (as JSONB array)
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('✓ Added images column');
    
    // Add booking_settings column (as JSONB)
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS booking_settings JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('✓ Added booking_settings column');
    
    // Add allow_bookings column
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS allow_bookings BOOLEAN DEFAULT TRUE;
    `);
    console.log('✓ Added allow_bookings column');
    
    // Add mobile column (if not exists)
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
    `);
    console.log('✓ Added mobile column');
    
    // Update opening_hours to accept longer values
    await pool.query(`
      ALTER TABLE businesses 
      ALTER COLUMN opening_hours TYPE VARCHAR(500);
    `);
    console.log('✓ Updated opening_hours column type');
    
    console.log('\n✅ All company info columns added successfully!\n');
    
    // Verify the changes
    const verifyRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'businesses'
      ORDER BY ordinal_position;
    `);
    
    console.log('Updated columns in businesses table:');
    verifyRes.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixCompanyInfoColumns();
