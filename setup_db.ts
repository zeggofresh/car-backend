import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setup() {
  try {
    console.log('Starting database setup...');

    // Create gift_cards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gift_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id),
        sender_name VARCHAR(255),
        recipient_mobile VARCHAR(20),
        message TEXT,
        service VARCHAR(255),
        price NUMERIC(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table gift_cards created or already exists.');

    // Create business_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id),
        full_name VARCHAR(255),
        username VARCHAR(255),
        phone VARCHAR(20),
        password_hash TEXT,
        branches JSONB,
        permissions JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table business_users created or already exists.');

    // Alter businesses table
    await pool.query(`
      ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS policy_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS policy_description TEXT,
      ADD COLUMN IF NOT EXISTS logo TEXT,
      ADD COLUMN IF NOT EXISTS company_images JSONB,
      ADD COLUMN IF NOT EXISTS opening_time VARCHAR(10),
      ADD COLUMN IF NOT EXISTS closing_time VARCHAR(10),
      ADD COLUMN IF NOT EXISTS booking_fee NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS auto_confirm BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS map_link TEXT;
    `);
    console.log('Table businesses altered successfully.');

    // Ensure purchases table exists (used in api/business.ts)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id),
        branch_id UUID REFERENCES branches(id),
        expense_type VARCHAR(100),
        content TEXT,
        price NUMERIC(10,2),
        vat_amount NUMERIC(10,2),
        total NUMERIC(10,2),
        invoice_image TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table purchases created or already exists.');

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error during database setup:', error);
  } finally {
    await pool.end();
  }
}

setup();
