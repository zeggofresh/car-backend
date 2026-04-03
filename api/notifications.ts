import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from './_db.js';
import { verifyToken, AuthenticatedRequest } from './_auth.js';

function isValidUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!verifyToken(req, res)) return;

  const url = req.url || '';
  const userId = req.user!.id;
  const role = req.user!.role;
  const businessId = req.user!.business_id;

  if (!userId || userId === '0' || !isValidUUID(userId)) {
    return res.status(200).json([]);
  }

  // GET /api/notifications
  if (req.method === 'GET') {
    try {
      let query = 'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50';
      let params: any[] = [userId];

      if ((role === 'business_owner' || role === 'business') && businessId && isValidUUID(businessId)) {
        query = 'SELECT * FROM notifications WHERE business_id = $1 ORDER BY created_at DESC LIMIT 50';
        params = [businessId];
      }

      const result = await pool.query(query, params);
      return res.json(result.rows);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /api/notifications/mark-read
  if (url.includes('/mark-read') && req.method === 'POST') {
    try {
      const { notificationIds } = req.body;
      
      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ message: 'Invalid notification IDs' });
      }

      let query = 'UPDATE notifications SET is_read = true WHERE id = ANY($1) AND user_id = $2';
      let params: any[] = [notificationIds, userId];

      if ((role === 'business_owner' || role === 'business') && businessId && isValidUUID(businessId)) {
        query = 'UPDATE notifications SET is_read = true WHERE id = ANY($1) AND business_id = $2';
        params = [notificationIds, businessId];
      }

      await pool.query(query, params);
      
      return res.json({ message: 'Notifications marked as read' });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}
