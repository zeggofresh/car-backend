import pool from './api/db.js';

async function updateSchema() {
  try {
    console.log('Updating businesses table schema...');
    
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS tax_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS tax_certificate_url TEXT,
      ADD COLUMN IF NOT EXISTS commercial_registration VARCHAR(100),
      ADD COLUMN IF NOT EXISTS cr_certificate_url TEXT;
    `);
    
    console.log('Schema updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

updateSchema();
