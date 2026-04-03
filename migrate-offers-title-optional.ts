import pool from './api/_db.js';

async function fixOffersTable() {
  console.log('Updating offers table - making title fields optional...\n');
  
  try {
    // Remove NOT NULL constraints from title_en and title_ar
    await pool.query(`
      ALTER TABLE offers 
      ALTER COLUMN title_en DROP NOT NULL;
    `);
    console.log('✓ Removed NOT NULL from title_en');
    
    await pool.query(`
      ALTER TABLE offers 
      ALTER COLUMN title_ar DROP NOT NULL;
    `);
    console.log('✓ Removed NOT NULL from title_ar');
    
    console.log('\n✅ Offers table updated successfully!\n');
    console.log('Now you can create offers without title_en or title_ar.\n');
    
  } catch (error) {
    console.error('Error updating offers table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixOffersTable();
