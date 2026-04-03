import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from './_db.js';
import { verifyToken, AuthenticatedRequest } from './_auth.js';
import { createNotification } from './_notifications_helper.js';
import axios from 'axios';

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!verifyToken(req, res)) return;

  const url = req.url || '';
  const userId = req.user!.id;

  // Ensure gift_cards table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gift_cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      business_id UUID REFERENCES businesses(id),
      service_id INTEGER REFERENCES services(id),
      code VARCHAR(20) UNIQUE NOT NULL,
      type VARCHAR(20) NOT NULL, -- 'cash' or 'service'
      initial_value DECIMAL(10, 2) NOT NULL,
      current_balance DECIMAL(10, 2) NOT NULL,
      expiry_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Ensure service_requests table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      business_id UUID REFERENCES businesses(id),
      branch_id INTEGER,
      service_id INTEGER REFERENCES services(id),
      request_date DATE,
      request_time TIME,
      car_plate VARCHAR(20),
      car_size VARCHAR(20),
      price DECIMAL(10, 2),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // GET /api/customer/gift-cards
  if (url.includes('/gift-cards') && req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT gc.*, s.name_en as service_name, b.name as business_name
        FROM gift_cards gc
        LEFT JOIN services s ON gc.service_id = s.id
        LEFT JOIN businesses b ON gc.business_id = b.id
        WHERE gc.user_id = $1
        ORDER BY gc.created_at DESC
      `, [userId]);
      return res.json(result.rows);
    } catch (error) {
      console.error('Error fetching gift cards:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /api/customer/gift-cards/purchase
  if (url.includes('/gift-cards/purchase') && req.method === 'POST') {
    try {
      const { type, amount, service_id, business_id } = req.body;
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const result = await pool.query(
        'INSERT INTO gift_cards (user_id, business_id, service_id, code, type, initial_value, current_balance, expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [userId, business_id || null, service_id || null, code, type, amount, amount, expiryDate]
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error purchasing gift card:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/customer/profile
  if (url.includes('/profile') && req.method === 'GET') {
    try {
      const result = await pool.query('SELECT id, name, phone, email, car_info FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
      return res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // PUT /api/customer/profile
  if (url.includes('/profile') && req.method === 'PUT') {
    try {
      const { name, phone, email, car_info, latitude, longitude } = req.body;
      
      console.log('Updating customer profile:', { name, phone, email, car_info, latitude, longitude });
      
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
      if (email !== undefined) {
        updates.push(`email = $${paramIndex}`);
        values.push(email);
        paramIndex++;
      }
      if (car_info !== undefined) {
        updates.push(`car_info = $${paramIndex}`);
        values.push(typeof car_info === 'object' ? JSON.stringify(car_info) : car_info);
        paramIndex++;
      }
      if (latitude !== undefined) {
        updates.push(`latitude = $${paramIndex}`);
        values.push(latitude);
        paramIndex++;
      }
      if (longitude !== undefined) {
        updates.push(`longitude = $${paramIndex}`);
        values.push(longitude);
        paramIndex++;
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }
      
      updates.push(`id = $${paramIndex}`);
      values.push(userId);
      
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, phone, email, car_info, latitude, longitude`;
      console.log('Executing customer profile update');
      
      const result = await pool.query(query, values);
      console.log('Customer profile updated:', result.rows[0].id);
      return res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /api/customer/location
  if (url.includes('/location') && req.method === 'POST') {
    try {
      const { latitude, longitude } = req.body;
      
      console.log('Updating user location:', { latitude, longitude });
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }
      
      const result = await pool.query(
        'UPDATE users SET latitude = $1, longitude = $2 WHERE id = $3 RETURNING id, name, latitude, longitude',
        [latitude, longitude, userId]
      );
      
      console.log('User location updated successfully');
      return res.json({ 
        success: true, 
        message: 'Location updated',
        data: result.rows[0] 
      });
    } catch (error) {
      console.error('Error updating location:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/customer/history
  if (url.includes('/history') && req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT w.*, b.name as business_name, s.name_en as service_name
        FROM washes w
        LEFT JOIN businesses b ON w.business_id = b.id
        LEFT JOIN services s ON w.service_id = s.id
        WHERE w.customer_id = $1
        ORDER BY w.created_at DESC
      `, [userId]);
      return res.json(result.rows);
    } catch (error) {
      console.error('Error fetching history:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/customer/subscription
  if (url.includes('/subscription') && req.method === 'GET') {
    try {
      // Check if table exists
      const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_subscriptions'");
      if (tablesRes.rows.length === 0) {
        console.log('Customer Subscriptions: Table customer_subscriptions does not exist');
        return res.json(null);
      }

      const result = await pool.query(`
        SELECT cs.*, s.name_en as plan_name, b.name as business_name
        FROM customer_subscriptions cs
        LEFT JOIN subscriptions s ON cs.subscription_id = s.id
        LEFT JOIN businesses b ON s.business_id = b.id
        WHERE cs.user_id = $1 AND cs.status = 'active'
        ORDER BY cs.created_at DESC
        LIMIT 1
      `, [userId]);
      
      console.log('Customer Subscriptions: Found:', result.rows.length);
      return res.json(result.rows[0] || null);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return res.json(null); // Return null instead of crashing if requested
    }
  }

  // GET /api/customer/plans
  if (url.includes('/plans') && req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT s.*, b.name as business_name
        FROM subscriptions s
        LEFT JOIN businesses b ON s.business_id = b.id
        WHERE s.active = true AND b.status = 'approved'
      `);
      return res.json(result.rows);
    } catch (error) {
      console.error('Error fetching plans:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/customer/centers/:id
  const centerMatch = url.match(/\/centers\/([a-f0-9-]+)/);
  if (centerMatch && req.method === 'GET') {
    try {
      const id = centerMatch[1];
      const result = await pool.query(`
        SELECT b.id, b.name, b.address, b.status,
          COALESCE((SELECT json_agg(s.*) FROM (
            SELECT 
              s.id,
              s.business_id,
              s.name_en,
              s.name_ar,
              s.type,
              s.price_small,
              s.price_medium,
              s.price_suv,
              s.active,
              s.created_at,
              s.price_medium as price -- Add calculated price field for frontend compatibility
            FROM services s
            WHERE s.business_id = b.id AND s.active = true
          ) s), '[]') as services,
          COALESCE((SELECT json_agg(sub.*) FROM subscriptions sub WHERE sub.business_id = b.id AND sub.active = true), '[]') as subscriptions
        FROM businesses b
        WHERE b.id = $1 AND b.status = 'approved'
      `, [id]);
      
      if (result.rows.length === 0) return res.status(404).json({ message: 'Center not found' });
      return res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching center details:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/customer/centers
  if (url.endsWith('/centers') && req.method === 'GET') {
    try {
      const userLat = url.split('lat=')[1]?.split('&')[0];
      const userLng = url.split('lng=')[1]?.split('&')[0];
      const radius = url.split('radius=')[1]?.split('&')[0] || '50'; // Default 50km
      
      console.log('Fetching centers with location:', { lat: userLat, lng: userLng, radius });
      
      let query = '';
      let params: any[] = [];
      
      if (userLat && userLng) {
        // User provided location - calculate distances and sort by nearest
        query = `
          SELECT b.id, b.name, b.address, b.status, b.latitude, b.longitude,
            COALESCE((SELECT json_agg(s.*) FROM (
              SELECT 
                s.id,
                s.business_id,
                s.name_en,
                s.name_ar,
                s.type,
                s.price_small,
                s.price_medium,
                s.price_suv,
                s.active,
                s.created_at,
                s.price_medium as price
              FROM services s
              WHERE s.business_id = b.id AND s.active = true
            ) s), '[]') as services,
            COALESCE((SELECT json_agg(sub.*) FROM subscriptions sub WHERE sub.business_id = b.id AND sub.active = true), '[]') as subscriptions,
            calculate_distance($1, $2, b.latitude, b.longitude) as distance_km
          FROM businesses b
          WHERE b.status = 'approved'
            AND b.latitude IS NOT NULL 
            AND b.longitude IS NOT NULL
            AND calculate_distance($1, $2, b.latitude, b.longitude) <= $3
          ORDER BY distance_km ASC
        `;
        params = [userLat, userLng, parseFloat(radius)];
      } else {
        // No location provided - return all approved businesses without distance
        query = `
          SELECT b.id, b.name, b.address, b.status,
            COALESCE((SELECT json_agg(s.*) FROM (
              SELECT 
                s.id,
                s.business_id,
                s.name_en,
                s.name_ar,
                s.type,
                s.price_small,
                s.price_medium,
                s.price_suv,
                s.active,
                s.created_at,
                s.price_medium as price
              FROM services s
              WHERE s.business_id = b.id AND s.active = true
            ) s), '[]') as services,
            COALESCE((SELECT json_agg(sub.*) FROM subscriptions sub WHERE sub.business_id = b.id AND sub.active = true), '[]') as subscriptions
          FROM businesses b
          WHERE b.status = 'approved'
        `;
      }
      
      const result = await pool.query(query, params);
      
      // If we have coordinates, enhance with Google Maps data
      if (result.rows.length > 0 && userLat && userLng) {
        const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCPQQJOJUYfHWW7NJNoFazbbDI07mmz3No';
        
        // Add formatted addresses and place details for each business
        const enhancedCenters = await Promise.all(
          result.rows.map(async (center: any) => {
            if (center.latitude && center.longitude) {
              try {
                // Get address from coordinates using Google Maps Geocoding
                const geoResponse = await axios.get(
                  `https://maps.googleapis.com/maps/api/geocode/json?latlng=${center.latitude},${center.longitude}&key=${GOOGLE_MAPS_API_KEY}`
                );
                
                if (geoResponse.data.status === 'OK' && geoResponse.data.results.length > 0) {
                  center.formatted_address = geoResponse.data.results[0].formatted_address;
                }
                
                // Calculate duration using Distance Matrix API (optional)
                try {
                  const distanceMatrix = await axios.get(
                    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLat},${userLng}&destinations=${center.latitude},${center.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
                  );
                  
                  if (distanceMatrix.data.status === 'OK' && 
                      distanceMatrix.data.rows[0]?.elements[0]?.status === 'OK') {
                    center.duration = distanceMatrix.data.rows[0].elements[0].duration.text;
                    center.distance_text = distanceMatrix.data.rows[0].elements[0].distance.text;
                  }
                } catch (err) {
                  console.log('Distance matrix not available for:', center.name);
                }
              } catch (error) {
                console.log('Google Maps enhancement failed for:', center.name, error);
              }
            }
            return center;
          })
        );
        
        console.log(`Found ${enhancedCenters.length} centers within ${radius}km`);
        return res.json(enhancedCenters);
      }
      
      console.log(`Found ${result.rows.length} centers`);
      return res.json(result.rows);
    } catch (error) {
      console.error('Error fetching centers:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /api/customer/requests
  if (url.includes('/requests') && req.method === 'POST') {
    const maxRetries = 2;
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { business_id, service_id, date, time } = req.body;

        console.log(`[Attempt ${attempt + 1}] Creating service request:`, { business_id, service_id, date, time, userId });
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        // Validate required fields
        if (!business_id || !service_id) {
          console.error('Missing required fields:', { business_id, service_id });
          return res.status(400).json({ success: false, message: 'Business ID and Service ID are required' });
        }

        // Convert service_id to number if it's a string
        const numericServiceId = typeof service_id === 'string' ? parseInt(service_id, 10) : service_id;
        if (isNaN(numericServiceId)) {
          console.error('Invalid service_id:', service_id);
          return res.status(400).json({ success: false, message: 'Service ID must be a valid number' });
        }

        // Get customer info for car size
        const userRes = await pool.query('SELECT name, car_info FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
          console.error('User not found:', userId);
          return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        const carInfo = userRes.rows[0]?.car_info || {};
        const carSize = (carInfo.size || 'medium').toLowerCase();
        const userName = userRes.rows[0]?.name || 'A customer';

        // Get service info for price - handle case where service might not exist
        console.log('Querying service with ID:', numericServiceId);
        const serviceRes = await pool.query('SELECT id, name_en, price_small, price_medium, price_suv FROM services WHERE id = $1', [numericServiceId]);
        console.log('Service query result:', serviceRes.rows);
        if (serviceRes.rows.length === 0) {
          console.error('Service not found:', numericServiceId);
          return res.status(404).json({ 
            success: false, 
            message: 'Service not found',
            debug: `Service ID ${numericServiceId} does not exist in database`
          });
        }
        
        const service = serviceRes.rows[0];
        console.log('Service found:', service);
        let price = service.price_medium; // Default to medium price
        if (carSize === 'small') price = service.price_small || service.price_medium;
        if (carSize === 'suv') price = service.price_suv || service.price_medium;

        console.log('Price calculated:', { carSize, price, service_prices: { small: service.price_small, medium: service.price_medium, suv: service.price_suv } });
        
        // Validate price is a valid number
        if (!price || isNaN(parseFloat(price))) {
          console.error('Invalid price calculated:', price);
          return res.status(500).json({ 
            success: false, 
            message: 'Service pricing is not configured correctly',
            debug: `Price for service ${numericServiceId} is invalid: ${price}`
          });
        }

        // Verify business exists and is approved
        const bizCheckRes = await pool.query('SELECT id, status FROM businesses WHERE id = $1', [business_id]);
        if (bizCheckRes.rows.length === 0) {
          console.error('Business not found:', business_id);
          return res.status(404).json({ success: false, message: 'Business not found' });
        }
        if (bizCheckRes.rows[0].status !== 'approved') {
          console.error('Business not approved:', business_id, 'Status:', bizCheckRes.rows[0].status);
          return res.status(400).json({ success: false, message: 'This business is not currently accepting requests' });
        }

        // Insert request - using user_id as per schema
        console.log('Inserting request with params:', {
          user_id: userId,
          business_id,
          service_id: numericServiceId,
          date: date || null,
          time: time || null,
          price,
          status: 'pending'
        });
        
        // Verify service_requests table exists and has required columns
        const tableCheck = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'service_requests'
        `);
        const hasPriceColumn = tableCheck.rows.some(row => row.column_name === 'price');
        
        if (!hasPriceColumn) {
          console.error('service_requests table is missing price column!');
          return res.status(500).json({ 
            success: false, 
            message: 'Database configuration error',
            debug: 'service_requests table is missing price column. Run migration: add-price-column-to-service-requests.sql'
          });
        }
        
        const result = await pool.query(
          'INSERT INTO service_requests (user_id, business_id, service_id, request_date, request_time, price, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
          [userId, business_id, numericServiceId, date || null, time || null, price, 'pending']
        );

        console.log('Request inserted successfully:', result.rows[0].id);

        // Notify business owner
        const ownerRes = await pool.query('SELECT id FROM users WHERE business_id = $1 AND role = $2', [business_id, 'business_owner']);
        if (ownerRes.rows.length > 0) {
          const serviceName = service.name_en || 'Service';
          
          await createNotification({
            userId: ownerRes.rows[0].id,
            businessId: business_id,
            title: 'New Service Request',
            message: `New service request from ${userName} for ${serviceName}.`,
            type: 'service_request',
            link: '/dashboard/requests'
          });
          console.log('Notification sent to business owner');
        }

        console.log('Request created successfully:', result.rows[0].id);
        return res.json({ success: true, message: 'Request sent successfully', request: result.rows[0] });
      } catch (error) {
        lastError = error;
        console.error(`[Attempt ${attempt + 1}] Error creating request:`, error);
        
        // If this was the last attempt, return error
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(100, attempt + 1);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // All retries failed
    console.error('All retry attempts failed. Last error:', lastError);
    console.error('Error stack:', lastError instanceof Error ? lastError.stack : 'No stack trace');
    const requestData = req.body;
    console.error('Request data that failed:', requestData);
    const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send request. Please try again.',
      debug: errorMessage,
      detail: (lastError as any)?.detail || 'Database error occurred'
    });
  }

  return res.status(404).json({ message: 'Not found' });
}
