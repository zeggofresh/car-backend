import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from './_db.js';
import { requireRole, AuthenticatedRequest } from './_auth.js';
import { createNotification } from './_notifications_helper.js';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  console.log('Business stats handler hit, method:', req.method, 'url:', req.url);
  
  // Lazy migration for subscriptions table
  try {
    await pool.query(`
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS description_en TEXT,
      ADD COLUMN IF NOT EXISTS description_ar TEXT,
      ADD COLUMN IF NOT EXISTS features_en TEXT[],
      ADD COLUMN IF NOT EXISTS features_ar TEXT[],
      ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
    `);
  } catch (e) {
    console.error('Lazy migration failed:', e);
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-branch-id');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!requireRole(req, res, 'business_owner')) return;

  const url = req.url || '';
  const path = url.split('?')[0].replace(/\/$/, '');
  let businessId = req.user!.business_id;
  const branchId = req.headers['x-branch-id'];
  const isSuperAdmin = req.user!.role === 'super_admin';

  // Helper for queries
  const getBusinessFilter = (prefix = '') => {
    if (isSuperAdmin && !businessId) return '1=1';
    return `${prefix}business_id = $1`;
  };
  const getParams = (baseParams: any[] = []) => {
    if (isSuperAdmin && !businessId) return baseParams;
    return [businessId, ...baseParams];
  };

  // GET /api/business/stats
  if (path.endsWith('/stats') && req.method === 'GET') {
    try {
      const businessRes = await pool.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
      const business = businessRes.rows[0];

      if (!business) {
        return res.status(200).json({
          businessName: '',
          ownerName: '',
          mobile: '',
          branchName: 'Main Branch',
          crNumber: '',
          taxNumber: '',
          status: 'pending',
          walletBalance: 0,
          dailySales: 0,
          dailyWashes: 0,
          dailyPurchases: 0,
          dailyInvoices: 0,
          weeklySales: [],
          qrCode: ''
        });
      }

      let currentBranch = { name: 'Main Branch' };
      if (branchId) {
        const branchRes = await pool.query('SELECT name FROM branches WHERE id = $1 AND business_id = $2', [branchId, businessId]);
        if (branchRes.rows.length > 0) {
          currentBranch = branchRes.rows[0];
        }
      }

      // Fetch some real daily stats for the dashboard to be useful
      const today = new Date().toISOString().split('T')[0];
      const washesRes = await pool.query(`SELECT COUNT(*), SUM(price) FROM washes WHERE business_id = $1 AND created_at::date = $2`, [businessId, today]);
      const purchasesRes = await pool.query(`SELECT COUNT(*), SUM(total) FROM purchases WHERE business_id = $1 AND created_at::date = $2`, [businessId, today]);
      const walletRes = await pool.query(`SELECT balance FROM wallet_balances WHERE business_id = $1`, [businessId]);

      return res.status(200).json({
        businessName: business.name || '',
        ownerName: business.owner_name || '',
        mobile: business.phone || business.mobile || '',
        branchName: currentBranch.name || 'Main Branch',
        crNumber: business.cr_number || business.commercial_registration || '',
        taxNumber: business.tax_number || '',
        status: business.status || 'pending',
        walletBalance: parseFloat(walletRes.rows[0]?.balance || '0'),
        dailySales: parseFloat(washesRes.rows[0]?.sum || '0'),
        dailyWashes: parseInt(washesRes.rows[0]?.count || '0'),
        dailyPurchases: parseFloat(purchasesRes.rows[0]?.sum || '0'),
        dailyInvoices: parseInt(purchasesRes.rows[0]?.count || '0'),
        weeklySales: [],
        qrCode: business.qr_code || ''
      });
    } catch (error) {
      console.error('Error fetching business stats:', error);
      return res.status(200).json({
        businessName: '',
        ownerName: '',
        mobile: '',
        branchName: 'Main Branch',
        crNumber: '',
        taxNumber: '',
        status: 'pending',
        walletBalance: 0,
        dailySales: 0,
        dailyWashes: 0,
        dailyPurchases: 0,
        dailyInvoices: 0,
        weeklySales: [],
        qrCode: ''
      });
    }
  }

  // GET /api/business/dashboard
  if (url.includes('/dashboard') && req.method === 'GET') {
    try {
      console.log('Fetching business dashboard for business:', businessId, 'branch:', branchId);
      
      let branchFilter = '';
      let params: any[] = [];
      let baseQuery = '';
      
      if (branchId) {
        branchFilter = 'AND branch_id = $2';
        params = [businessId, branchId];
        baseQuery = `SELECT COUNT(*) as count FROM service_requests WHERE business_id = $1 ${branchFilter}`;
      } else {
        params = [businessId];
        baseQuery = `SELECT COUNT(*) as count FROM service_requests WHERE business_id = $1`;
      }

      const requestsRes = await pool.query(baseQuery, params);
      const customersRes = await pool.query(
        `SELECT COUNT(DISTINCT user_id) as count FROM service_requests WHERE business_id = $1`,
        [businessId]
      );
      const revenueRes = await pool.query(
        `SELECT SUM(price) as total FROM washes WHERE business_id = $1`,
        [businessId]
      );
      
      console.log('Dashboard data fetched successfully');
      
      return res.json({
        totalRequests: parseInt(requestsRes.rows[0].count || '0'),
        totalCustomers: parseInt(customersRes.rows[0].count || '0'),
        revenue: parseFloat(revenueRes.rows[0].total || '0'),
      });
    } catch (error) {
      console.error('Error fetching business dashboard:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // /api/business/services
  if (url.includes('/services')) {
    if (req.method === 'GET') {
      try {
        console.log('Fetching services for business:', businessId);
        const result = await pool.query(`SELECT * FROM services WHERE ${getBusinessFilter()} ORDER BY created_at DESC`, getParams());
        console.log('Services fetched:', result.rowCount);
        return res.json(result.rows);
      } catch (error) {
        console.error('Error fetching services:', error);
        return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (req.method === 'POST') {
      try {
        const { name_en, name_ar, type, price_small, price_medium, price_suv, active } = req.body;
        console.log('Creating service:', { name_en, name_ar, type, price_small, price_medium, price_suv });
        
        // Validate required fields
        if (!name_en || !type || price_small == null || price_medium == null || price_suv == null) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Validate and normalize type field to match database constraints
        const validTypes = ['Exterior', 'Interior', 'Full', 'Full Detailing'];
        const normalizedType = validTypes.find(t => t.toLowerCase() === type.toLowerCase());
        if (!normalizedType) {
          return res.status(400).json({ 
            message: 'Invalid service type. Must be one of: Exterior, Interior, Full, Full Detailing',
            provided: type,
            valid: validTypes
          });
        }
        
        const result = await pool.query(
          'INSERT INTO services (business_id, name_en, name_ar, type, price_small, price_medium, price_suv, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [businessId, name_en, name_ar || '', normalizedType, price_small, price_medium, price_suv, active ?? true]
        );
        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error creating service:', error);
        return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (req.method === 'PUT') {
      try {
        const { id, name_en, name_ar, type, price_small, price_medium, price_suv, active } = req.body;
        console.log('Updating service:', { id, name_en, name_ar, type });
        
        if (!id || !name_en || !type || price_small == null || price_medium == null || price_suv == null) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Validate and normalize type field
        const validTypes = ['Exterior', 'Interior', 'Full', 'Full Detailing'];
        const normalizedType = validTypes.find(t => t.toLowerCase() === type.toLowerCase());
        if (!normalizedType) {
          return res.status(400).json({ 
            message: 'Invalid service type. Must be one of: Exterior, Interior, Full, Full Detailing',
            provided: type,
            valid: validTypes
          });
        }
        
        const result = await pool.query(
          'UPDATE services SET name_en = $1, name_ar = $2, type = $3, price_small = $4, price_medium = $5, price_suv = $6, active = $7 WHERE id = $8 AND business_id = $9 RETURNING *',
          [name_en, name_ar || '', normalizedType, price_small, price_medium, price_suv, active ?? true, id, businessId]
        );
        return res.json(result.rows[0]);
      } catch (error) {
        console.error('Error updating service:', error);
        return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (req.method === 'DELETE') {
      try {
        const id = url.split('/').pop();
        console.log('Deleting service:', id);
        await pool.query('DELETE FROM services WHERE id = $1 AND business_id = $2', [id, businessId]);
        return res.json({ message: 'Deleted' });
      } catch (error) {
        console.error('Error deleting service:', error);
        return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  // /api/business/subscriptions
  if (url.includes('/subscriptions')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query(`SELECT * FROM subscriptions WHERE ${getBusinessFilter()} ORDER BY created_at DESC`, getParams());
        // Map wash_limit to total_washes for frontend compatibility
        const mapped = result.rows.map((row: any) => ({
          ...row,
          total_washes: row.wash_limit,
          features_en: row.features_en || [],
          features_ar: row.features_ar || [],
          is_popular: row.is_popular || false
        }));
        return res.json(mapped);
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'POST') {
      try {
        const { 
          name_en, name_ar, description_en, description_ar, 
          total_washes, wash_limit, duration_days, price, 
          features_en, features_ar, is_popular, active 
        } = req.body;
        
        const limit = total_washes !== undefined ? total_washes : wash_limit;
        
        const result = await pool.query(
          `INSERT INTO subscriptions (
            business_id, name_en, name_ar, description_en, description_ar, 
            wash_limit, duration_days, price, features_en, features_ar, 
            is_popular, active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
          [
            businessId, name_en, name_ar, description_en, description_ar, 
            limit, duration_days, price, features_en || [], features_ar || [], 
            is_popular || false, active ?? true
          ]
        );
        return res.status(201).json({
          ...result.rows[0],
          total_washes: result.rows[0].wash_limit
        });
      } catch (error) {
        console.error('Error creating subscription:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'PUT') {
      try {
        const { 
          id, name_en, name_ar, description_en, description_ar, 
          total_washes, wash_limit, duration_days, price, 
          features_en, features_ar, is_popular, active 
        } = req.body;
        
        const limit = total_washes !== undefined ? total_washes : wash_limit;
        
        const result = await pool.query(
          `UPDATE subscriptions SET 
            name_en = $1, name_ar = $2, description_en = $3, description_ar = $4, 
            wash_limit = $5, duration_days = $6, price = $7, features_en = $8, 
            features_ar = $9, is_popular = $10, active = $11 
          WHERE id = $12 AND business_id = $13 RETURNING *`,
          [
            name_en, name_ar, description_en, description_ar, 
            limit, duration_days, price, features_en || [], features_ar || [], 
            is_popular || false, active ?? true, id, businessId
          ]
        );
        return res.json({
          ...result.rows[0],
          total_washes: result.rows[0].wash_limit
        });
      } catch (error) {
        console.error('Error updating subscription:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'DELETE') {
      try {
        const id = url.split('/').pop();
        await pool.query('DELETE FROM subscriptions WHERE id = $1 AND business_id = $2', [id, businessId]);
        return res.json({ message: 'Deleted' });
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
  }

  // /api/business/offers
  if (url.includes('/offers')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query(`SELECT * FROM offers WHERE ${getBusinessFilter()} ORDER BY created_at DESC`, getParams());
        return res.json(result.rows);
      } catch (error) {
        console.error('Error fetching offers:', error);
        return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (req.method === 'POST') {
      try {
        const { title_en, title_ar, description_en, description_ar, discount_percentage, valid_until, active, start_date, expiry_date } = req.body;
        
        // Validate discount percentage
        if (discount_percentage != null && (discount_percentage < 0 || discount_percentage > 100)) {
          return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
        }
        
        // Map start_date and expiry_date to database columns
        const startDate = start_date || null;
        const endDate = expiry_date || valid_until || null;
        
        const result = await pool.query(
          'INSERT INTO offers (business_id, title_en, title_ar, description_en, description_ar, discount_percentage, valid_until, start_date, end_date, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
          [businessId, title_en || '', title_ar || '', description_en || '', description_ar || '', discount_percentage, endDate, startDate, endDate, active ?? true]
        );
        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error creating offer:', error);
        return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (req.method === 'PUT') {
      try {
        const { id, title_en, title_ar, description_en, description_ar, discount_percentage, valid_until, active, start_date, expiry_date } = req.body;
        
        if (!id) {
          return res.status(400).json({ message: 'Offer ID is required' });
        }
        
        // Validate discount percentage
        if (discount_percentage != null && (discount_percentage < 0 || discount_percentage > 100)) {
          return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
        }
        
        // Map start_date and expiry_date to database columns
        const startDate = start_date !== undefined ? start_date : null;
        const endDate = expiry_date !== undefined ? expiry_date : valid_until || null;
        
        const result = await pool.query(
          'UPDATE offers SET title_en = $1, title_ar = $2, description_en = $3, description_ar = $4, discount_percentage = $5, valid_until = $6, start_date = $7, end_date = $8, active = $9 WHERE id = $10 AND business_id = $11 RETURNING *',
          [title_en || '', title_ar || '', description_en || '', description_ar || '', discount_percentage, endDate, startDate, endDate, active ?? true, id, businessId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Offer not found' });
        }
        
        return res.json(result.rows[0]);
      } catch (error) {
        console.error('Error updating offer:', error);
        return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (req.method === 'DELETE') {
      try {
        const id = url.split('/').pop();
        if (!id) {
          return res.status(400).json({ message: 'Offer ID is required' });
        }
        
        const result = await pool.query('DELETE FROM offers WHERE id = $1 AND business_id = $2 RETURNING *', [id, businessId]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Offer not found' });
        }
        
        return res.json({ message: 'Deleted' });
      } catch (error) {
        console.error('Error deleting offer:', error);
        return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  // /api/business/requests
  if (url.includes('/requests')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT sr.*, u.name as customer_name, s.name_en as service_name, s.price as service_price, b.name as business_name
          FROM service_requests sr
          LEFT JOIN users u ON sr.user_id = u.id
          LEFT JOIN services s ON sr.service_id = s.id
          LEFT JOIN businesses b ON sr.business_id = b.id
          ORDER BY sr.created_at DESC
        `);
        return res.json(result.rows || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
        return res.status(200).json([]); // Always return 200 with empty array on error as requested
      }
    }
    if (req.method === 'PUT') {
      try {
        const { id, status } = req.body;
        
        console.log('Updating service request:', { id, status, businessId });
        
        if (!id || !status) {
          console.error('Missing required fields for request update:', { id, status });
          return res.status(400).json({ message: 'Request ID and status are required' });
        }
        
        if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
          console.error('Invalid status value:', status);
          return res.status(400).json({ message: 'Invalid status value' });
        }
        
        const result = await pool.query(
          'UPDATE service_requests SET status = $1 WHERE id = $2 AND business_id = $3 RETURNING *',
          [status, id, businessId]
        );
        if (result.rows.length === 0) {
          console.error('Request not found:', id);
          return res.status(404).json({ message: 'Not found' });
        }
        const request = result.rows[0];
        
        console.log('Request updated successfully:', request.id);
        
        const bizRes = await pool.query('SELECT name FROM businesses WHERE id = $1', [businessId]);
        const bizName = bizRes.rows[0]?.name || 'Business';

        if (status === 'approved') {
          await createNotification({
            userId: request.user_id,
            title: 'Request Approved',
            message: `Your request has been approved by ${bizName}.`,
            type: 'service_update',
            link: '/app/history'
          });
          console.log('Approval notification sent to user:', request.user_id);
        } else if (status === 'rejected') {
          await createNotification({
            userId: request.user_id,
            title: 'Request Rejected',
            message: `Your request has been rejected by ${bizName}.`,
            type: 'service_update',
            link: '/app/history'
          });
          console.log('Rejection notification sent to user:', request.user_id);
        }

        return res.json(request);
      } catch (error) {
        console.error('Error updating request:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
  }

  // /api/business/branches
  if (url.includes('/branches')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query(`SELECT * FROM branches WHERE ${getBusinessFilter()} ORDER BY created_at DESC`, getParams());
        return res.json(result.rows);
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'POST') {
      try {
        const { name, address, phone } = req.body;
        const result = await pool.query(
          'INSERT INTO branches (business_id, name, address, phone) VALUES ($1, $2, $3, $4) RETURNING *',
          [businessId, name, address, phone]
        );
        return res.status(201).json(result.rows[0]);
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
  }

  // /api/business/customers
  if (url.includes('/customers') && req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT DISTINCT u.id, u.name, u.phone, u.email, u.car_info
        FROM users u
        JOIN service_requests sr ON u.id = sr.user_id
        WHERE ${getBusinessFilter('sr.')}
      `, getParams());
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // /api/business/customers/search
  if (url.includes('/customers/search') && req.method === 'GET') {
    try {
      const phone = url.split('phone=')[1]?.split('&')[0];
      if (!phone) return res.status(400).json({ message: 'Phone required' });
      
      // Support partial matching with LIKE
      const result = await pool.query(
        'SELECT id, name, phone FROM users WHERE phone LIKE $1 LIMIT 10', 
        [`%${phone}%`]
      );
      
      if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
      
      // If exact match, return single customer, otherwise return array
      if (result.rows.length === 1) {
        return res.json(result.rows[0]);
      } else {
        return res.json(result.rows);
      }
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // /api/business/best-customers
  if (url.includes('/best-customers') && req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT u.id, u.name, u.phone, COUNT(w.id) as wash_count
        FROM users u
        JOIN washes w ON u.id = w.customer_id
        WHERE w.business_id = $1
        GROUP BY u.id, u.name, u.phone
        ORDER BY wash_count DESC
        LIMIT 10
      `, [businessId]);
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // /api/business/reports
  if (url.includes('/reports') && req.method === 'GET') {
    try {
      // 1. Revenue by Service
      const serviceRevenueRes = await pool.query(`
        SELECT s.name_en as name, SUM(w.price) as revenue
        FROM washes w
        JOIN services s ON w.service_id = s.id
        WHERE w.business_id = $1
        GROUP BY s.name_en
      `, [businessId]);

      const colors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
      const serviceData = serviceRevenueRes.rows.map((row: any, index: number) => ({
        name: row.name,
        revenue: parseFloat(row.revenue),
        color: colors[index % colors.length]
      }));

      // 2. Commission Data
      const bizRes = await pool.query('SELECT commission_rate FROM businesses WHERE id = $1', [businessId]);
      const rate = (bizRes.rows[0]?.commission_rate || 10) / 100;

      const monthRevenueRes = await pool.query(`
        SELECT SUM(price) as total
        FROM washes
        WHERE business_id = $1 AND created_at >= date_trunc('month', now())
      `, [businessId]);
      
      const monthRevenue = parseFloat(monthRevenueRes.rows[0].total || '0');
      const calculated = monthRevenue * rate;
      const minThreshold = 500; // Example threshold
      const finalDue = Math.max(calculated, 0);

      return res.json({
        serviceData,
        commission: {
          monthRevenue,
          rate,
          calculated,
          minThreshold,
          finalDue
        }
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // /api/business/washes
  if (url.includes('/washes')) {
    if (req.method === 'GET') {
      try {
        let branchFilter = '';
        let params = getParams();
        let paramIndex = params.length + 1;
        
        if (branchId) {
          branchFilter = `AND w.branch_id = $${paramIndex}`;
          params.push(branchId);
        }
        const result = await pool.query(`
          SELECT w.*, u.name as customer_name, u.phone as customer_phone, s.name_en as service_name
          FROM washes w
          LEFT JOIN users u ON w.customer_id = u.id
          LEFT JOIN services s ON w.service_id = s.id
          WHERE ${getBusinessFilter('w.')} ${branchFilter}
          ORDER BY w.created_at DESC
        `, params);
        return res.json(result.rows);
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'POST') {
      try {
        const { customer_id, service_id, car_size, price, payment_method } = req.body;
        console.log('Recording wash:', { businessId, branchId, customer_id, service_id, car_size, price, payment_method });
        
        // Validate required fields
        if (!customer_id || !service_id || !car_size || !price || !payment_method) {
          return res.status(400).json({ 
            message: 'Missing required fields',
            required: ['customer_id', 'service_id', 'car_size', 'price', 'payment_method']
          });
        }
        
        // Validate car_size
        const validCarSizes = ['small', 'medium', 'suv'];
        if (!validCarSizes.includes(car_size.toLowerCase())) {
          return res.status(400).json({ 
            message: 'Invalid car_size. Must be one of: small, medium, suv',
            provided: car_size,
            valid: validCarSizes
          });
        }
        
        // Validate payment_method
        const validPaymentMethods = ['cash', 'pos', 'online', 'subscription'];
        if (!validPaymentMethods.includes(payment_method.toLowerCase())) {
          return res.status(400).json({ 
            message: 'Invalid payment_method. Must be one of: cash, pos, online, subscription',
            provided: payment_method,
            valid: validPaymentMethods
          });
        }
        
        const result = await pool.query(
          'INSERT INTO washes (business_id, branch_id, customer_id, service_id, car_size, price, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [businessId, branchId || null, customer_id, service_id, car_size.toLowerCase(), price, payment_method.toLowerCase()]
        );
        console.log('Wash recorded successfully:', result.rows[0].id);
        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error recording wash:', error);
        return res.status(500).json({ 
          message: 'Server error', 
          error: error instanceof Error ? error.message : String(error),
          detail: (error as any)?.detail || (error as any)?.message || 'Unknown database error'
        });
      }
    }
  }

  // /api/business/purchases
  if (url.includes('/purchases')) {
    if (req.method === 'GET') {
      try {
        let branchFilter = '';
        let params = getParams();
        let paramIndex = params.length + 1;
        
        if (branchId) {
          branchFilter = `AND branch_id = $${paramIndex}`;
          params.push(branchId);
        }
        const result = await pool.query(`SELECT * FROM purchases WHERE ${getBusinessFilter()} ${branchFilter} ORDER BY created_at DESC`, params);
        return res.json(result.rows);
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'POST') {
      try {
        const { expense_type, content, price, vat_amount, total, invoice_image } = req.body;
        const result = await pool.query(
          'INSERT INTO purchases (business_id, branch_id, expense_type, content, price, vat_amount, total, invoice_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [businessId, branchId || null, expense_type, content, price, vat_amount, total, invoice_image]
        );
        return res.status(201).json(result.rows[0]);
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'DELETE') {
      try {
        const id = url.split('/').pop();
        await pool.query('DELETE FROM purchases WHERE id = $1 AND business_id = $2', [id, businessId]);
        return res.json({ message: 'Deleted' });
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
  }

  // /api/business/wallet
  if (url.includes('/wallet') && req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM wallet_balances WHERE business_id = $1', [businessId]);
      if (result.rows.length === 0) {
        // Initialize wallet if not exists
        const initRes = await pool.query('INSERT INTO wallet_balances (business_id, balance, pending_settlement) VALUES ($1, 0, 0) RETURNING *', [businessId]);
        return res.json(initRes.rows[0]);
      }
      return res.json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // /api/business/profile
  if (url.includes('/profile')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Business not found' });
        return res.json(result.rows[0]);
      } catch (error) {
        console.error('Error fetching business profile:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'PUT') {
      try {
        const { name, address, tax_number, commercial_registration, cover_image, opening_hours } = req.body;
        
        console.log('Updating business profile:', { name, address, tax_number, commercial_registration, opening_hours });
        
        // Validate at least one field is provided
        if (!name && !address && !tax_number && !commercial_registration && !cover_image && !opening_hours) {
          console.error('No fields provided for business profile update');
          return res.status(400).json({ message: 'At least one field must be provided' });
        }
        
        // Build dynamic query to only update provided fields
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (name !== undefined) {
          updates.push(`name = $${paramIndex}`);
          values.push(name);
          paramIndex++;
        }
        if (address !== undefined) {
          updates.push(`address = $${paramIndex}`);
          values.push(address);
          paramIndex++;
        }
        if (tax_number !== undefined) {
          updates.push(`tax_number = $${paramIndex}`);
          values.push(tax_number);
          paramIndex++;
        }
        if (commercial_registration !== undefined) {
          updates.push(`commercial_registration = $${paramIndex}`);
          values.push(commercial_registration);
          paramIndex++;
        }
        if (cover_image !== undefined) {
          updates.push(`cover_image = $${paramIndex}`);
          values.push(cover_image);
          paramIndex++;
        }
        if (opening_hours !== undefined) {
          updates.push(`opening_hours = $${paramIndex}`);
          values.push(opening_hours);
          paramIndex++;
        }
        
        if (updates.length === 0) {
          return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        updates.push(`id = $${paramIndex}`);
        values.push(businessId);
        
        const query = `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        console.log('Executing update query:', query);
        
        const result = await pool.query(query, values);
        console.log('Business profile updated:', result.rows[0].id);
        return res.json(result.rows[0]);
      } catch (error) {
        console.error('Error updating business profile:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
  }

  // /api/business/gift-cards
  if (url.includes('/gift-cards')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query('SELECT * FROM gift_cards WHERE business_id = $1 ORDER BY created_at DESC', [businessId]);
        return res.json(result.rows);
      } catch (error) {
        console.error('Error fetching gift cards:', error);
        return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (req.method === 'POST') {
      try {
        const { sender_name, recipient_mobile, message, service_id, price } = req.body;
        
        console.log('Creating gift card:', { 
          businessId, 
          sender_name, 
          recipient_mobile, 
          message, 
          service_id, 
          price 
        });
        
        // Generate a unique code for the gift card
        const code = 'GC' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const result = await pool.query(
          `INSERT INTO gift_cards (
            business_id, 
            sender_name, 
            recipient_mobile, 
            message, 
            service_id, 
            price,
            code,
            type,
            initial_value,
            current_balance,
            expiry_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [
            businessId, 
            sender_name, 
            recipient_mobile, 
            message || '', 
            service_id || null, 
            price || 0,
            code,
            'service',
            price || 0,
            price || 0,
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
          ]
        );
        console.log('Gift card created successfully:', result.rows[0].id);
        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error creating gift card:', error);
        return res.status(500).json({ 
          message: 'Server error',
          error: error instanceof Error ? error.message : String(error),
          details: (error as any)?.detail || (error as any)?.message || 'Unknown database error'
        });
      }
    }
    if (req.method === 'DELETE') {
      try {
        const id = url.split('/').pop();
        if (!id) {
          return res.status(400).json({ message: 'Gift card ID required' });
        }
        await pool.query('DELETE FROM gift_cards WHERE id = $1 AND business_id = $2', [id, businessId]);
        return res.json({ message: 'Deleted' });
      } catch (error) {
        console.error('Error deleting gift card:', error);
        return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  // /api/business/business-users
  if (url.includes('/business-users')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query('SELECT id, name, username, phone, account_type, branch_ids, permissions FROM business_users WHERE business_id = $1', [businessId]);
        return res.json(result.rows);
      } catch (error) {
        console.error('Error fetching business users:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'POST') {
      try {
        const { name, username, phone, password, branch_ids, permissions, account_type } = req.body;
        
        // Validate required fields
        if (!name || !username || !phone || !password) {
          return res.status(400).json({ message: 'Name, username, phone, and password are required' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
          'INSERT INTO business_users (business_id, name, username, phone, password, branch_ids, permissions, account_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, username, phone, account_type, branch_ids, permissions',
          [businessId, name, username, phone, hashedPassword, branch_ids, permissions, account_type || 'staff']
        );
        console.log('Business user created:', result.rows[0].id);
        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error creating business user:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'PUT') {
      try {
        const id = url.split('/').pop();
        if (!id) return res.status(400).json({ message: 'User ID required' });
        
        const { name, username, phone, branch_ids, permissions, account_type } = req.body;
        
        // Validate at least one field is provided
        if (!name && !username && !phone && !branch_ids && !permissions && !account_type) {
          return res.status(400).json({ message: 'At least one field must be provided' });
        }
        
        const result = await pool.query(
          'UPDATE business_users SET name = COALESCE($1, name), username = COALESCE($2, username), phone = COALESCE($3, phone), branch_ids = COALESCE($4, branch_ids), permissions = COALESCE($5, permissions), account_type = COALESCE($6, account_type) WHERE id = $7 AND business_id = $8 RETURNING id, name, username, phone, account_type, branch_ids, permissions',
          [name, username, phone, branch_ids, permissions, account_type, id, businessId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('Business user updated:', result.rows[0].id);
        return res.json(result.rows[0]);
      } catch (error) {
        console.error('Error updating business user:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'DELETE') {
      try {
        const id = url.split('/').pop();
        if (!id) return res.status(400).json({ message: 'User ID required' });
        
        await pool.query('DELETE FROM business_users WHERE id = $1 AND business_id = $2', [id, businessId]);
        console.log('Business user deleted:', id);
        return res.json({ message: 'Deleted' });
      } catch (error) {
        console.error('Error deleting business user:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
  }

  // /api/business/company-info
  if (url.includes('/company-info')) {
    if (req.method === 'GET') {
      try {
        const result = await pool.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Business not found' });
        return res.json(result.rows[0]);
      } catch (error) {
        console.error('Error fetching company info:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    if (req.method === 'PUT') {
      try {
        const { name, phone, tax_number, commercial_registration, map_link, logo, images, opening_hours, booking_settings, allow_bookings, mobile } = req.body;
        
        // Map cr_number to commercial_registration for backward compatibility
        const crNumber = commercial_registration || req.body.cr_number;
        
        // Map working_hours to opening_hours for backward compatibility
        const hours = opening_hours !== undefined ? opening_hours : req.body.working_hours;
        
        console.log('Updating company info:', { 
          name, 
          phone, 
          tax_number, 
          crNumber, 
          hours,
          map_link,
          logo,
          allow_bookings,
          mobile
        });
        
        // Build dynamic query to only update provided fields
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (name !== undefined) {
          updates.push(`name = $${paramIndex}`);
          values.push(name);
          paramIndex++;
        }
        if (phone !== undefined) {
          updates.push(`phone = $${paramIndex}`);
          values.push(phone);
          paramIndex++;
        }
        if (tax_number !== undefined) {
          updates.push(`tax_number = $${paramIndex}`);
          values.push(tax_number);
          paramIndex++;
        }
        if (crNumber !== undefined) {
          updates.push(`commercial_registration = $${paramIndex}`);
          values.push(crNumber);
          paramIndex++;
        }
        if (map_link !== undefined) {
          updates.push(`map_link = $${paramIndex}`);
          values.push(map_link);
          paramIndex++;
        }
        if (logo !== undefined) {
          updates.push(`logo = $${paramIndex}`);
          values.push(logo);
          paramIndex++;
        }
        if (images !== undefined) {
          updates.push(`images = $${paramIndex}`);
          values.push(JSON.stringify(images));
          paramIndex++;
        }
        if (hours !== undefined) {
          updates.push(`opening_hours = $${paramIndex}`);
          values.push(hours);
          paramIndex++;
        }
        if (booking_settings !== undefined) {
          updates.push(`booking_settings = $${paramIndex}`);
          values.push(JSON.stringify(booking_settings));
          paramIndex++;
        }
        if (allow_bookings !== undefined) {
          updates.push(`allow_bookings = $${paramIndex}`);
          values.push(allow_bookings);
          paramIndex++;
        }
        if (mobile !== undefined) {
          updates.push(`mobile = $${paramIndex}`);
          values.push(mobile);
          paramIndex++;
        }
        
        if (updates.length === 0) {
          return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        updates.push(`id = $${paramIndex}`);
        values.push(businessId);
        
        const query = `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        console.log('Executing company info update');
        
        const result = await pool.query(query, values);
        console.log('Company info updated successfully:', result.rows[0].id);
        return res.json(result.rows[0]);
      } catch (error) {
        console.error('Error updating company info:', error);
        return res.status(500).json({ 
          message: 'Server error',
          error: error instanceof Error ? error.message : String(error),
          details: (error as any)?.detail || (error as any)?.message || 'Unknown database error'
        });
      }
    }
  }

  // /api/business/center-policy
  if (url.includes('/center-policy') && req.method === 'PUT') {
    try {
      const { policy_number, policy_description } = req.body;
      const result = await pool.query(
        'UPDATE businesses SET policy_number = $1, policy_description = $2 WHERE id = $3 RETURNING *',
        [policy_number, policy_description, businessId]
      );
      return res.json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // /api/business/export
  if (url.includes('/export') && req.method === 'POST') {
    try {
      const { type, startDate, endDate } = req.body;
      let query = '';
      let params = [businessId];
      
      if (type === 'sales') {
        query = 'SELECT * FROM washes WHERE business_id = $1';
        if (startDate && endDate) {
          query += ' AND created_at BETWEEN $2 AND $3';
          params.push(startDate, endDate);
        }
      } else if (type === 'purchases') {
        query = 'SELECT * FROM purchases WHERE business_id = $1';
        if (startDate && endDate) {
          query += ' AND created_at BETWEEN $2 AND $3';
          params.push(startDate, endDate);
        }
      } else if (type === 'customers') {
        query = 'SELECT DISTINCT u.* FROM users u JOIN washes w ON u.id = w.customer_id WHERE w.business_id = $1';
      } else if (type === 'subscriptions') {
        query = 'SELECT * FROM subscriptions WHERE business_id = $1';
      }

      const result = await pool.query(query, params);
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}
