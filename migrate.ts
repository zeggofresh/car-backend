import pool from './api/db.js';

async function migrate() {
  try {
    console.log('Starting migrations...');

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        business_id UUID,
        type VARCHAR(50),
        title VARCHAR(255),
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Notifications table created or already exists.');

    // Update users table for OAuth
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
      ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255),
      ALTER COLUMN password_hash DROP NOT NULL;
    `);
    console.log('Users table updated for OAuth.');
    
    // Add landing page fields to businesses
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS cover_image TEXT,
      ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2),
      ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(255);
    `);
    console.log('Businesses table updated with landing page fields.');

    // Create purchases table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id),
        branch_id INTEGER,
        expense_type VARCHAR(100),
        content TEXT,
        price NUMERIC(10,2),
        vat_amount NUMERIC(10,2),
        total NUMERIC(10,2),
        invoice_image TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Purchases table created.');

    // Create wallet_balances table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_balances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id),
        balance NUMERIC(10,2) DEFAULT 0,
        pending_settlement NUMERIC(10,2) DEFAULT 0,
        last_settlement TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Wallet balances table created.');

    // Update notifications table with link
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS link TEXT;
    `);
    console.log('Notifications table updated with link column.');

    // Update service_requests table
    await pool.query(`
      ALTER TABLE service_requests 
      ADD COLUMN IF NOT EXISTS car_plate VARCHAR(20),
      ADD COLUMN IF NOT EXISTS car_size VARCHAR(20);
    `);
    console.log('Service requests table updated with car info.');

    console.log('Migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
