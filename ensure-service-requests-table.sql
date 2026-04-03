-- Ensure service_requests table exists with correct structure
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_business_id ON service_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

-- Verify table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_requests' 
ORDER BY ordinal_position;
