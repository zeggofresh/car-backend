import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { Resend } from 'resend';
import pool from '../api/_db.js';
import { createNotification } from '../api/_notifications_helper.js';

const router = express.Router();

console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'loaded' : 'MISSING');
const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, jpeg, png) and PDFs are allowed'));
  }
}).fields([
  { name: 'taxCertificate', maxCount: 1 },
  { name: 'crCertificate', maxCount: 1 }
]);

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

const loginSchema = z.object({
  phone: z.string().min(3),
  password: z.string().min(3),
});

const registerSchema = z.object({
  phone: z.string().min(3),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(3),
  name: z.string().min(2),
  role: z.enum(['customer', 'business_owner']),
  businessName: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  commercialRegistration: z.string().optional(),
});

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('[Auth] Login attempt:', { phone: req.body.phone, hasPassword: !!req.body.password });
    const { phone, password } = loginSchema.parse(req.body);

    // Super Admin Login
    if (process.env.ADMIN_PASSWORD && phone === 'admin' && password === process.env.ADMIN_PASSWORD) {
      let adminRes = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
      let adminId = adminRes.rows[0]?.id;

      if (!adminId) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const insertRes = await pool.query(
          "INSERT INTO users (phone, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
          ['admin', 'Super Admin', hash, 'super_admin']
        );
        adminId = insertRes.rows[0].id;
      }

      const token = jwt.sign(
        { id: adminId, phone: 'admin', role: 'super_admin', business_id: null },
        JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.json({ token, user: { id: adminId, name: 'Super Admin', role: 'super_admin', business_id: null } });
    }

    const result = await pool.query(`
      SELECT u.*, b.status as business_status 
      FROM users u 
      LEFT JOIN businesses b ON u.business_id = b.id 
      WHERE u.phone = $1
    `, [phone]);
    const user = result.rows[0];
    console.log('[Auth] User lookup result:', user ? `User found: ${user.name}` : 'No user found');

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.role === 'business_owner' && user.business_status === 'pending') {
      return res.status(403).json({ message: 'Your account is under review. Please wait for admin approval.' });
    }

    if (user.role === 'business_owner' && user.business_status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('[Auth] Password match result:', isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, business_id: user.business_id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({ token, user: { id: user.id, name: user.name, role: user.role, business_id: user.business_id } });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return res.status(400).json({ message: error.message || 'Login failed' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    await runMiddleware(req, res, upload);
    
    const body = req.body;
    const { phone, email, password, name, role, businessName, address, taxNumber, commercialRegistration } = registerSchema.parse(body);

    const userCheck = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User with this phone already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let businessId = null;

    if (role === 'business_owner') {
      if (!businessName) {
        return res.status(400).json({ message: 'Business name is required' });
      }

      const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };
      const taxCertificateUrl = files && files['taxCertificate'] ? `data:${files['taxCertificate'][0].mimetype};base64,${files['taxCertificate'][0].buffer.toString('base64')}` : null;
      const crCertificateUrl = files && files['crCertificate'] ? `data:${files['crCertificate'][0].mimetype};base64,${files['crCertificate'][0].buffer.toString('base64')}` : null;

      const businessResult = await pool.query(
        'INSERT INTO businesses (name, status, address, tax_number, tax_certificate_url, commercial_registration, cr_certificate_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [businessName, 'pending', address, taxNumber, taxCertificateUrl, commercialRegistration, crCertificateUrl]
      );
      businessId = businessResult.rows[0].id;
    }

    const newUser = await pool.query(
      'INSERT INTO users (phone, email, name, password_hash, role, business_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, role, business_id',
      [phone, email || null, name, hashedPassword, role, businessId]
    );

    const user = newUser.rows[0];

    if (role === 'business_owner') {
      // Notify Admin
      const adminRes = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
      const adminId = adminRes.rows[0]?.id;

      if (adminId) {
        await createNotification({
          userId: adminId,
          title: 'New Business Registration',
          message: `${businessName} just registered. Click to review their application.`,
          type: 'business_approval',
          link: '/admin/businesses'
        });

        // Send Email to Admin
        try {
          console.log('Attempting to send admin notification email via Resend...');
          const emailRes = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'ravi2009u@gmail.com',
            subject: `New Business Registration — ${businessName}`,
            text: `${businessName} just registered on 360Cars and is awaiting your review and approval.`
          });
          console.log('Resend response:', emailRes);
        } catch (emailError: any) {
          console.error('CRITICAL: Failed to send admin notification email:', emailError);
          if (emailError.response) {
            console.error('Resend Error Response:', emailError.response.data);
          }
        }
      }

      return res.status(201).json({ 
        message: 'Your account is under review. You will be notified once approved.',
        requiresApproval: true 
      });
    }

    const token = jwt.sign(
      { id: user.id, phone, role: user.role, business_id: user.business_id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(201).json({ message: 'User created successfully', token, user });
  } catch (error: any) {
    console.error('[Auth] Register error:', error);
    return res.status(400).json({ message: error.message || 'Registration failed' });
  }
});

// Admin login route
router.post('/admin-login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ message: 'Admin password not configured' });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    let adminRes = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
    let adminId = adminRes.rows[0]?.id;

    if (!adminId) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const insertRes = await pool.query(
        "INSERT INTO users (phone, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
        ['admin', 'Super Admin', hash, 'super_admin']
      );
      adminId = insertRes.rows[0].id;
    }

    const token = jwt.sign(
      { id: adminId, phone: 'admin', role: 'super_admin', business_id: null },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({ token, user: { id: adminId, name: 'Super Admin', role: 'super_admin', business_id: null } });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
