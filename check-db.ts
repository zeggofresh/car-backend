import pool from './api/db';

async function checkDb() {
  try {
    console.log('Checking database connection...');
    const client = await pool.connect();
    console.log('Database connected successfully.');

    console.log('Checking tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables found:', tables.rows.map(row => row.table_name));

    if (tables.rows.length === 0) {
      console.log('No tables found. Schema might not be applied.');
    }

    client.release();
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDb();
