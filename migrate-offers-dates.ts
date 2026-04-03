import pool from './api/_db.js';

async function addOfferDates() {
  console.log('Adding start_date and end_date columns to offers table...\n');
  
  try {
    // Add start_date column
    await pool.query(`
      ALTER TABLE offers 
      ADD COLUMN IF NOT EXISTS start_date DATE;
    `);
    console.log('✓ Added start_date column');
    
    // Add end_date column
    await pool.query(`
      ALTER TABLE offers 
      ADD COLUMN IF NOT EXISTS end_date DATE;
    `);
    console.log('✓ Added end_date column');
    
    console.log('\n✅ Offers table updated successfully!\n');
    console.log('Now supports:');
    console.log('  - start_date: Offer start date');
    console.log('  - end_date: Offer end date (same as valid_until)');
    console.log('  - expiry_date: Frontend alias for end_date\n');
    
  } catch (error) {
    console.error('Error updating offers table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addOfferDates();
