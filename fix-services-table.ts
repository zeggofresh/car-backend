import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkServicesTable() {
  try {
    console.log('Checking services table...\n');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'services'
      );
    `);
    
    console.log('Table exists:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('\n❌ Services table does not exist!');
      console.log('Creating services table...\n');
      
      await pool.query(`
        CREATE TABLE services (
          id SERIAL PRIMARY KEY,
          business_id UUID REFERENCES businesses(id),
          name_en VARCHAR(255) NOT NULL,
          name_ar VARCHAR(255),
          type VARCHAR(50) NOT NULL CHECK (type IN ('Exterior', 'Interior', 'Full', 'Full Detailing')),
          price_small DECIMAL(10, 2) NOT NULL,
          price_medium DECIMAL(10, 2) NOT NULL,
          price_suv DECIMAL(10, 2) NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      
      console.log('✅ Services table created successfully!');
    } else {
      console.log('\n✅ Services table exists');
      
      // Check columns
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'services'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nColumns in services table:');
      columns.rows.forEach((col, i) => {
        console.log(`  ${i + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Check for invalid columns that might cause issues
      const columnNames = columns.rows.map(c => c.column_name);
      const invalidColumns = ['price', 'price_large'];
      const foundInvalid = invalidColumns.filter(col => columnNames.includes(col));
      
      if (foundInvalid.length > 0) {
        console.log('\n⚠️  Found invalid columns that need to be removed:', foundInvalid);
        console.log('Run this SQL to drop them:');
        console.log(`ALTER TABLE services DROP COLUMN IF EXISTS ${foundInvalid.join(', DROP COLUMN IF EXISTS ')};`);
      }
      
      // Check row count
      const count = await pool.query('SELECT COUNT(*) FROM services');
      console.log(`\nTotal rows in services: ${count.rows[0].count}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkServicesTable();
