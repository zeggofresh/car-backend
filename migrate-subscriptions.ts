import pool from './api/_db.js';

async function migrate() {
  try {
    console.log('Adding missing columns to subscriptions table...');
    await pool.query(`
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS description_en TEXT,
      ADD COLUMN IF NOT EXISTS description_ar TEXT,
      ADD COLUMN IF NOT EXISTS features_en TEXT[],
      ADD COLUMN IF NOT EXISTS features_ar TEXT[],
      ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
    `);
    
    // Also rename wash_limit to total_washes to match frontend, or just add an alias in the API
    // Actually, let's keep wash_limit but ensure the API maps it.
    // Or just add total_washes as a column and migrate data?
    // Let's just add total_washes as an alias in the API for now, 
    // but the frontend sends total_washes, so the API should accept it.
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
