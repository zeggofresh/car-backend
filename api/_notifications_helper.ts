import pool from './_db.js';

export async function createNotification({
  userId,
  businessId,
  title,
  message,
  type = 'info',
  link = null
}: {
  userId: string | null;
  businessId?: string | null;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
}) {
  try {
    // 1. Store in database
    await pool.query(
      'INSERT INTO notifications (user_id, business_id, title, message, type, is_read) VALUES ($1, $2, $3, $4, $5, false)',
      [userId, businessId || null, title, message, type]
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
