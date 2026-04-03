-- Check if services table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'services';

-- Check columns in services table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;

-- Try to see what's in the table
SELECT * FROM services LIMIT 5;
