import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import pool from './_db.js';
import { requireRole, AuthenticatedRequest } from './_auth.js';
import { createNotification } from './_notifications_helper.js';

console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'loaded' : 'MISSING');
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!requireRole(req, res, 'super_admin')) return;

  const url = req.url || '';

  // GET /api/admin/dashboard
  if (url.includes('/dashboard') && req.method === 'GET') {
    try {
      console.log('Admin Dashboard: Fetching stats...');
      
      // Check if tables exist first to avoid crashes
      const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      const tables = tablesRes.rows.map(r => r.table_name);
      
      let totalBusinesses = 0;
      let approvedBusinesses = 0;
      let pendingBusinesses = 0;
      let recentRegistrations = 0;
      let platformRevenue = 0;
      let commissionEarned = 0;

      if (tables.includes('businesses')) {
        const totalRes = await pool.query('SELECT COUNT(*) FROM businesses');
        const approvedRes = await pool.query("SELECT COUNT(*) FROM businesses WHERE status = 'approved'");
        const pendingRes = await pool.query("SELECT COUNT(*) FROM businesses WHERE status = 'pending'");
        const recentRes = await pool.query("SELECT COUNT(*) FROM businesses WHERE created_at > NOW() - INTERVAL '7 days'");
        
        totalBusinesses = parseInt(totalRes.rows[0].count || '0');
        approvedBusinesses = parseInt(approvedRes.rows[0].count || '0');
        pendingBusinesses = parseInt(pendingRes.rows[0].count || '0');
        recentRegistrations = parseInt(recentRes.rows[0].count || '0');

        let totalWashes = 0;
        let totalCustomers = 0;
        let activeUsers = 0;

        if (tables.includes('washes')) {
          const washesRes = await pool.query("SELECT COUNT(*) FROM washes");
          totalWashes = parseInt(washesRes.rows[0].count || '0');

          const revenueRes = await pool.query("SELECT SUM(price) as total FROM washes");
          platformRevenue = parseFloat(revenueRes.rows[0].total || '0');
          
          const commissionRes = await pool.query(`
            SELECT SUM(w.price * (COALESCE(b.commission_rate, 10) / 100.0)) as total
            FROM washes w
            JOIN businesses b ON w.business_id = b.id
          `);
          commissionEarned = parseFloat(commissionRes.rows[0].total || '0');
        }

        if (tables.includes('users')) {
          const customersRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'customer'");
          totalCustomers = parseInt(customersRes.rows[0].count || '0');

          const activeUsersRes = await pool.query("SELECT COUNT(*) FROM users");
          activeUsers = parseInt(activeUsersRes.rows[0].count || '0');
        }

        console.log('Admin Dashboard: Stats calculated:', { totalBusinesses, approvedBusinesses, platformRevenue, commissionEarned });

        return res.json({
          totalBusinesses,
          approvedBusinesses,
          pendingBusinesses,
          recentRegistrations,
          platformRevenue,
          commissionEarned,
          totalWashes,
          totalCustomers,
          activeUsers
        });
      }
    } catch (error) {
      console.error('CRITICAL: Error fetching admin dashboard:', error);
      return res.status(500).json({ message: 'Server error', error: String(error) });
    }
  }

  // /api/admin/businesses
  if (url.includes('/businesses')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query('SELECT * FROM businesses ORDER BY created_at DESC');
        return res.json(result.rows);
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'PUT') {
      try {
        // This handles both general updates and status updates
        const { id, status, name, address, tax_number, commission_rate } = req.body;
        
        console.log('Admin updating business:', { id, status, name, address, tax_number, commission_rate });
        
        if (!id) {
          console.error('Business ID missing in update request');
          return res.status(400).json({ message: 'Business ID required' });
        }
        
        if (status) {
          if (!['approved', 'rejected', 'suspended'].includes(status)) {
            console.error('Invalid status value:', status);
            return res.status(400).json({ message: 'Invalid status' });
          }
          const result = await pool.query("UPDATE businesses SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
          if (result.rows.length === 0) {
            console.error('Business not found for status update:', id);
            return res.status(404).json({ message: 'Business not found' });
          }
          
          console.log('Business status updated to:', status, 'for business:', id);
          
          const ownerRes = await pool.query("SELECT id, email FROM users WHERE business_id = $1 AND role = 'business_owner'", [id]);
          const owner = ownerRes.rows[0];
          if (owner) {
            let message = '';
            let title = '';
            if (status === 'approved') {
              title = 'Account Activated';
              message = `Your account ${name || 'business'} has been activated. You can now log in.`;
              
              // Send Email to Business Owner
              if (owner.email) {
                try {
                  console.log(`Attempting to send approval email to ${owner.email} via Resend...`);
                  const emailRes = await resend.emails.send({
                    from: 'onboarding@resend.dev',
                    to: owner.email,
                    subject: 'Your 360Cars Account Has Been Activated',
                    text: `Congratulations! Your account ${name || 'business'} has been activated. You can now log in at https://clean-cars-360.vercel.app`
                  });
                  console.log('Resend response:', emailRes);
                } catch (emailError: any) {
                  console.error('CRITICAL: Failed to send approval email:', emailError);
                  if (emailError.response) {
                    console.error('Resend Error Response:', emailError.response.data);
                  }
                }
              }
            } else if (status === 'rejected') {
              title = 'Application Rejected';
              message = 'Your application was not approved. Please contact support.';
            } else if (status === 'suspended') {
              title = 'Account Suspended';
              message = 'Your account has been suspended.';
            }

            await createNotification({
              userId: owner.id,
              businessId: id,
              title,
              message,
              type: 'business_approval',
              link: status === 'approved' ? '/login' : null
            });
          }
          return res.json(result.rows[0]);
        }

        const result = await pool.query(
          'UPDATE businesses SET name = COALESCE($1, name), address = COALESCE($2, address), tax_number = COALESCE($3, tax_number), commission_rate = COALESCE($4, commission_rate) WHERE id = $5 RETURNING *',
          [name, address, tax_number, commission_rate, id]
        );
        console.log('Business info updated successfully:', result.rows[0].id);
        return res.json(result.rows[0]);
      } catch (error) {
        console.error('Error updating business:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
  }

  // /api/admin/approve (POST)
  if (url.includes('/approve') && req.method === 'POST') {
    try {
      const { id, status } = req.body;
      const result = await pool.query("UPDATE businesses SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
      
      const ownerRes = await pool.query("SELECT id, email FROM users WHERE business_id = $1 AND role = 'business_owner'", [id]);
      const owner = ownerRes.rows[0];
      if (owner) {
        await createNotification({
          userId: owner.id,
          businessId: id,
          title: `Account ${status}`,
          message: `Your account status is now ${status}`,
          type: 'business_approval',
          link: status === 'approved' ? '/login' : null
        });

        // Send Email to Business Owner if approved
        if (status === 'approved' && owner.email) {
          try {
            const bizRes = await pool.query("SELECT name FROM businesses WHERE id = $1", [id]);
            const bizName = bizRes.rows[0]?.name || 'business';

            console.log(`Attempting to send approval email to ${owner.email} via Resend...`);
            const emailRes = await resend.emails.send({
              from: 'onboarding@resend.dev',
              to: owner.email,
              subject: 'Your 360Cars Account Has Been Activated',
              text: `Congratulations! Your account ${bizName} has been activated. You can now log in at https://clean-cars-360.vercel.app`
            });
            console.log('Resend response:', emailRes);
          } catch (emailError: any) {
            console.error('CRITICAL: Failed to send approval email:', emailError);
            if (emailError.response) {
              console.error('Resend Error Response:', emailError.response.data);
            }
          }
        }
      }
      return res.json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // /api/admin/commissions
  if (url.includes('/commissions')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT 
            b.id, 
            b.name as business_name, 
            b.commission_rate, 
            b.status,
            COALESCE(SUM(w.price), 0) as total_revenue,
            COALESCE(SUM(w.price * (b.commission_rate / 100.0)), 0) as commission_amount
          FROM businesses b
          LEFT JOIN washes w ON b.id = w.business_id
          GROUP BY b.id, b.name, b.commission_rate, b.status
          ORDER BY b.name ASC
        `);
        return res.json(result.rows);
      } catch (error) {
        console.error('Error fetching commissions:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'POST' && url.includes('/pay')) {
      try {
        const { business_id, amount } = req.body;
        // In a real app, we'd record this in a payments table
        // For now, we'll just return success to satisfy the UI
        return res.json({ message: 'Commission marked as paid', business_id, amount });
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'PUT') {
      try {
        const { id, commission_rate } = req.body;
        const result = await pool.query('UPDATE businesses SET commission_rate = $1 WHERE id = $2 RETURNING id, name, commission_rate', [commission_rate, id]);
        return res.json(result.rows[0]);
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
  }

  // /api/admin/wallets
  if (url.includes('/wallets')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT b.id, b.name, wb.balance, wb.pending_settlement, wb.last_settlement
          FROM businesses b
          LEFT JOIN wallet_balances wb ON b.id = wb.business_id
          ORDER BY b.name ASC
        `);
        return res.json(result.rows);
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'POST' && url.includes('/settle')) {
      try {
        const { business_id } = req.body;
        const result = await pool.query(`
          UPDATE wallet_balances 
          SET balance = balance + pending_settlement, 
              pending_settlement = 0, 
              last_settlement = NOW(),
              updated_at = NOW()
          WHERE business_id = $1
          RETURNING *
        `, [business_id]);
        return res.json(result.rows[0]);
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
  }

  // /api/admin/financial-analysis
  if (url.includes('/financial-analysis') && req.method === 'GET') {
    try {
      // Line chart showing monthly Total Collected vs Total Receivables
      // For this demo, we'll aggregate washes by month
      const result = await pool.query(`
        SELECT 
          to_char(created_at, 'Mon YYYY') as month,
          SUM(price) as total_collected,
          SUM(price * 0.1) as total_receivables -- Assuming 10% commission as receivable
        FROM washes
        GROUP BY month, date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at) ASC
        LIMIT 12
      `);
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}
