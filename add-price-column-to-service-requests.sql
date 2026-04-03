-- Add price column to service_requests table if it doesn't exist
DO $$ 
BEGIN 
  -- Check if price column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_requests' 
    AND column_name = 'price'
  ) THEN
    -- Add price column
    ALTER TABLE service_requests 
    ADD COLUMN price DECIMAL(10, 2);
    
    RAISE NOTICE 'Added price column to service_requests table';
  ELSE
    RAISE NOTICE 'price column already exists in service_requests table';
  END IF;
  
  -- Also ensure car_size column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_requests' 
    AND column_name = 'car_size'
  ) THEN
    ALTER TABLE service_requests 
    ADD COLUMN car_size VARCHAR(20);
    
    RAISE NOTICE 'Added car_size column to service_requests table';
  ELSE
    RAISE NOTICE 'car_size column already exists in service_requests table';
  END IF;
  
  -- Verify final structure
  RAISE NOTICE 'Final service_requests table structure:';
END $$;

-- Show current columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'service_requests'
ORDER BY ordinal_position;
