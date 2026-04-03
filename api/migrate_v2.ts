import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Starting service request flow migrations via API...');

    // 1. Rename user_id to customer_id in service_requests
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'service_requests' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE service_requests RENAME COLUMN user_id TO customer_id;
        END IF;
      END $$;
    `);
    console.log('Renamed user_id to customer_id in service_requests.');

    // 2. Add price and price_large to services
    await pool.query(`
      ALTER TABLE services 
      ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS price_large DECIMAL(10, 2);
    `);
    console.log('Added price and price_large to services.');

    return res.status(200).json({ success: true, message: 'Migrations completed successfully.' });
  } catch (error) {
    console.error('Migration failed:', error);
    return res.status(500).json({ success: false, message: 'Migration failed', error: String(error) });
  }
}
