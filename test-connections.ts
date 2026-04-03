import pg from 'pg';
import ftp from 'basic-ftp';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function testDatabase() {
  console.log('🔍 Testing Database Connection...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    await client.release();
    
    console.log('✅ Database connected successfully!');
    console.log(`   Server time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('   Error:', error);
    return false;
  } finally {
    await pool.end();
  }
}

async function testFTP() {
  console.log('\n🔍 Testing FTP Connection...\n');
  
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: process.env.FTP_HOST || 'ftp.cleancarsksa.com',
      port: parseInt(process.env.FTP_PORT || '21'),
      user: process.env.FTP_USERNAME || '',
      password: process.env.FTP_PASSWORD || '',
      secure: false
    });

    console.log('✅ FTP connected successfully!');
    
    // List files in root directory
    const files = await client.list();
    console.log(`\n📁 Found ${files.length} files/directories:`);
    files.slice(0, 10).forEach((file: any) => {
      console.log(`   ${file.name} (${file.size} bytes, ${file.type})`);
    });
    
    if (files.length > 10) {
      console.log(`   ... and ${files.length - 10} more`);
    }

    client.close();
    return true;
  } catch (error) {
    console.error('❌ FTP connection failed!');
    console.error('   Error:', error);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('   CONNECTION TEST SUITE');
  console.log('═══════════════════════════════════════════\n');
  
  const dbResult = await testDatabase();
  const ftpResult = await testFTP();
  
  console.log('\n═══════════════════════════════════════════');
  console.log('   SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`Database: ${dbResult ? '✅ CONNECTED' : '❌ FAILED'}`);
  console.log(`FTP:      ${ftpResult ? '✅ CONNECTED' : '❌ FAILED'}`);
  console.log('═══════════════════════════════════════════\n');
  
  if (dbResult && ftpResult) {
    console.log('🎉 All connections successful!');
  } else {
    console.log('⚠️  Some connections failed. Please check your credentials.\n');
  }
}

main().catch(console.error);
