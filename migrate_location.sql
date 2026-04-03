-- Migration: Add location columns for nearest business feature
-- Run this on your existing database

-- Add location columns to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add location columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for faster geolocation queries
CREATE INDEX IF NOT EXISTS idx_business_location ON businesses(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_location ON users(latitude, longitude);

-- Optional: Add distance calculation function (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius INTEGER := 6371; -- Earth radius in kilometers
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Convert to radians
  dlat = RADIANS(lat2 - lat1);
  dlon = RADIANS(lon2 - lon1);
  
  -- Haversine formula
  a = SIN(dlat/2)^2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2)^2;
  c = 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comment: This migration adds geolocation support for finding nearest businesses
-- After running this, you can:
-- 1. Update business locations: UPDATE businesses SET latitude = ?, longitude = ? WHERE id = ?
-- 2. Update user locations: UPDATE users SET latitude = ?, longitude = ? WHERE id = ?
-- 3. Query nearest businesses using the calculate_distance function
