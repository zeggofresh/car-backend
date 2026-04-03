import ftp from 'basic-ftp';
import dotenv from 'dotenv';

dotenv.config();

export async function connectFTP() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

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
    console.log('\n📁 Files in root directory:');
    files.forEach((file: any) => {
      console.log(`   ${file.name} (${file.size} bytes, ${file.type})`);
    });

    return client;
  } catch (error) {
    console.error('❌ FTP connection error:', error);
    throw error;
  }
}

export async function uploadToFTP(filePath: string, remotePath: string) {
  const client = await connectFTP();
  
  try {
    await client.uploadFrom(filePath, remotePath);
    console.log(`✅ File uploaded successfully: ${remotePath}`);
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  } finally {
    client.close();
  }
}

export async function downloadFromFTP(remotePath: string, localPath: string) {
  const client = await connectFTP();
  
  try {
    await client.downloadTo(localPath, remotePath);
    console.log(`✅ File downloaded successfully: ${localPath}`);
  } catch (error) {
    console.error('❌ Download error:', error);
    throw error;
  } finally {
    client.close();
  }
}

// Test connection if run directly
if (process.argv[1]?.endsWith('ftp-connect.ts')) {
  (async () => {
    try {
      const client = await connectFTP();
      client.close();
      process.exit(0);
    } catch {
      process.exit(1);
    }
  })();
}
