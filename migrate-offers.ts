import pool from './api/_db.js';

async function migrateOffersTable() {
  console.log('Starting offers table migration...');
  
  try {
    // Add new columns for bilingual support
    await pool.query(`
      ALTER TABLE offers 
      ADD COLUMN IF NOT EXISTS title_en VARCHAR(255) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS title_ar VARCHAR(255) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS description_en TEXT,
      ADD COLUMN IF NOT EXISTS description_ar TEXT;
    `);
    
    console.log('New columns added successfully');
    
    // Migrate existing data from old columns to new ones
    await pool.query(`
      UPDATE offers 
      SET title_en = COALESCE(title, ''), 
          description_en = COALESCE(description, description_en)
      WHERE title_en = '';
    `);
    
    console.log('Existing data migrated');
    
    // Drop old columns if they exist (optional - you may want to keep them for backup)
    await pool.query(`
      ALTER TABLE offers 
      DROP COLUMN IF EXISTS title,
      DROP COLUMN IF EXISTS description;
    `);
    
    console.log('Old columns removed');
    
    console.log('Offers table migration completed successfully!');
  } catch (error) {
    console.error('Error during offers table migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateOffersTable();
