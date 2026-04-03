import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from './_db.js';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const { lat, lng, radius = 100000 } = req.query; // radius in meters (default 100km)
    
    // If location provided, filter by distance
    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      
      console.log('Finding nearest centers for:', { lat: userLat, lng: userLng, radius: radius + 'm' });
      
      // Get all approved businesses with location data
      const result = await pool.query(`
        SELECT *, 
          (6371 * acos(
            cos(radians($1::float)) * cos(radians(latitude::float)) * 
            cos(radians(longitude::float) - radians($2::float)) + 
            sin(radians($1::float)) * sin(radians(latitude::float))
          )) AS distance_km
        FROM businesses 
        WHERE status = 'approved' 
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
      `, [userLat, userLng]);
      
      console.log('Raw query result count:', result.rowCount);
      
      // Filter by radius in JavaScript
      let businesses = result.rows.filter(b => {
        const distance = parseFloat(b.distance_km);
        return !isNaN(distance) && distance <= (parseFloat(radius as string) / 1000);
      });
      
      // Sort by distance
      businesses.sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km));
      
      console.log('Filtered businesses count:', businesses.length);
      if (businesses.length > 0) {
        console.log('Nearest business:', businesses[0].name, 'at', businesses[0].distance_km, 'km');
      }
      
      // Add Google Maps distance matrix if API key exists
      const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
      
      if (businesses.length > 0 && GOOGLE_MAPS_KEY && req.query.mode === 'with_distances') {
        try {
          // Calculate real road distances using Google Maps
          const destinations = businesses.map(b => `${b.latitude},${b.longitude}`).join('|');
          const googleRes = await axios.get(
            `https://maps.googleapis.com/maps/api/distancematrix/json`,
            {
              params: {
                origins: `${userLat},${userLng}`,
                destinations: destinations,
                key: GOOGLE_MAPS_KEY,
                mode: 'driving'
              }
            }
          );
          
          // Add distance and duration info to each business
          if (googleRes.data.status === 'OK') {
            const elements = googleRes.data.rows[0]?.elements || [];
            businesses.forEach((b, idx) => {
              if (elements[idx]) {
                b.distance_text = elements[idx].distance?.text || null;
                b.duration_text = elements[idx].duration?.text || null;
                b.distance_value = elements[idx].distance?.value || null;
                b.duration_value = elements[idx].duration?.value || null;
              }
            });
          }
        } catch (error) {
          console.error('Google Maps API error:', error);
          // Continue without Google Maps data if API fails
        }
      }
      
      return res.status(200).json(businesses);
    } else {
      // No location provided, return all approved businesses
      const result = await pool.query(`
        SELECT * FROM businesses 
        WHERE status = 'approved' 
        ORDER BY created_at DESC
      `);
      return res.status(200).json(result.rows);
    }
  } catch (err) {
    console.error('Centers error:', err);
    return res.status(200).json([]);
  }
}
