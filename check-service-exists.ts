import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

interface Service {
  id: number;
  business_id: string;
  name_en: string;
  type: string;
  price_small: number | string;
  price_medium: number | string;
  price_suv: number | string;
}

async function checkServices() {
  try {
    console.log('Checking services table...');
    
    // Check if service ID 3 exists
    const result = await pool.query('SELECT * FROM services WHERE id = 3');
    console.log('Service ID 3:', result.rows);
    
    // Get all services
    const allServices = await pool.query('SELECT id, business_id, name_en, type, price_small, price_medium, price_suv FROM services ORDER BY id LIMIT 10');
    console.log('\nAll Services (first 10):');
    allServices.rows.forEach((service: Service) => {
      console.log(`ID: ${service.id}, Name: ${service.name_en}, Type: ${service.type}, Prices: Small=${service.price_small}, Medium=${service.price_medium}, SUV=${service.price_suv}`);
    });
    
    // Check if business exists
    const businessId = '1947885a-8479-4062-b6e1-4a886903a9df';
    const bizResult = await pool.query('SELECT id, name, status FROM businesses WHERE id = $1', [businessId]);
    console.log(`\nBusiness ${businessId}:`, bizResult.rows[0] || 'NOT FOUND');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkServices();
