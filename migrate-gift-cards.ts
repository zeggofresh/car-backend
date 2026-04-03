import pool from './api/_db.js';

async function fixGiftCardsTable() {
  console.log('Checking and fixing gift_cards table...\n');
  
  try {
    // Check if gift_cards table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gift_cards'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ gift_cards table does not exist!');
      console.log('Creating gift_cards table...\n');
      
      await pool.query(`
        CREATE TABLE gift_cards (
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
      
      console.log('✅ gift_cards table created successfully!\n');
    } else {
      console.log('✅ gift_cards table exists');
      
      // Check current columns
      const columnsRes = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'gift_cards'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nCurrent columns in gift_cards:');
      columnsRes.rows.forEach(row => {
        console.log(`  ${row.column_name} (${row.data_type})`);
      });
      
      // Add missing columns if needed
      const columnNames = columnsRes.rows.map(r => r.column_name);
      
      if (!columnNames.includes('sender_name')) {
        await pool.query(`ALTER TABLE gift_cards ADD COLUMN sender_name VARCHAR(255);`);
        console.log('✓ Added sender_name column');
      }
      
      if (!columnNames.includes('recipient_mobile')) {
        await pool.query(`ALTER TABLE gift_cards ADD COLUMN recipient_mobile VARCHAR(20);`);
        console.log('✓ Added recipient_mobile column');
      }
      
      if (!columnNames.includes('message')) {
        await pool.query(`ALTER TABLE gift_cards ADD COLUMN message TEXT;`);
        console.log('✓ Added message column');
      }
      
      if (!columnNames.includes('service')) {
        await pool.query(`ALTER TABLE gift_cards ADD COLUMN service VARCHAR(255);`);
        console.log('✓ Added service column');
      }
      
      if (!columnNames.includes('price')) {
        await pool.query(`ALTER TABLE gift_cards ADD COLUMN price NUMERIC(10,2);`);
        console.log('✓ Added price column');
      }
      
      console.log('\n✅ gift_cards table structure verified!\n');
    }
    
  } catch (error) {
    console.error('Error fixing gift_cards table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixGiftCardsTable();
