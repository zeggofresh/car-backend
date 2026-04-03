import pool from './api/_db.js';

async function ensureTablesExist() {
  console.log('🔧 Ensuring all database tables exist...\n');
  
  try {
    // 1. Ensure service_requests table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        business_id UUID REFERENCES businesses(id),
        service_id INTEGER REFERENCES services(id),
        request_date DATE,
        request_time TIME,
        price DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ service_requests table OK');
    
    // 2. Ensure subscriptions table has all columns
    await pool.query(`
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS description_en TEXT,
      ADD COLUMN IF NOT EXISTS description_ar TEXT,
      ADD COLUMN IF NOT EXISTS features_en TEXT[],
      ADD COLUMN IF NOT EXISTS features_ar TEXT[],
      ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ subscriptions table migrated');
    
    // 3. Ensure wallet_balances table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_balances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id),
        balance DECIMAL(10, 2) DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ wallet_balances table OK');
    
    // 4. Ensure gift_cards table exists with correct types
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gift_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        business_id UUID REFERENCES businesses(id),
        service_id INTEGER REFERENCES services(id),
        code VARCHAR(20) UNIQUE NOT NULL,
        type VARCHAR(20) NOT NULL,
        initial_value DECIMAL(10, 2) NOT NULL,
        current_balance DECIMAL(10, 2) NOT NULL,
        expiry_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ gift_cards table OK');
    
    // 5. Ensure washes table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS washes (
        id SERIAL PRIMARY KEY,
        business_id UUID REFERENCES businesses(id),
        customer_name VARCHAR(255),
        car_size VARCHAR(20),
        service_type VARCHAR(50),
        price DECIMAL(10, 2),
        status VARCHAR(20),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ washes table OK');
    
    // 6. Ensure purchases table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        business_id UUID REFERENCES businesses(id),
        item_name VARCHAR(255),
        quantity INTEGER,
        total DECIMAL(10, 2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ purchases table OK');
    
    // 7. Create default wallet for existing businesses if not exists
    const businessesRes = await pool.query('SELECT id FROM businesses');
    for (const biz of businessesRes.rows) {
      try {
        await pool.query(
          'INSERT INTO wallet_balances (business_id, balance) VALUES ($1, 0) ON CONFLICT DO NOTHING',
          [biz.id]
        );
      } catch (e) {
        // Wallet might already exist
      }
    }
    console.log('✅ Default wallets created');
    
    console.log('\n🎉 All database tables are ready!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

ensureTablesExist();
