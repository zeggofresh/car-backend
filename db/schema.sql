-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  min_monthly_commission DECIMAL(10, 2) DEFAULT 0,
  address TEXT,
  tax_number VARCHAR(100),
  tax_certificate_url TEXT,
  commercial_registration VARCHAR(100),
  cr_certificate_url TEXT,
  cover_image TEXT,
  rating DECIMAL(3, 2),
  opening_hours VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'business_owner', 'customer')),
  business_id UUID REFERENCES businesses(id),
  lang VARCHAR(5) DEFAULT 'en',
  car_info JSONB,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branches Table
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  type VARCHAR(50) NOT NULL CHECK (type IN ('Exterior', 'Interior', 'Full', 'Full Detailing')),
  price_small DECIMAL(10, 2) NOT NULL,
  price_medium DECIMAL(10, 2) NOT NULL,
  price_suv DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description_en TEXT,
  description_ar TEXT,
  wash_limit INTEGER NOT NULL, -- 99 for unlimited
  duration_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  features_en TEXT[],
  features_ar TEXT[],
  is_popular BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Subscriptions Table
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  washes_used INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Washes Table
CREATE TABLE IF NOT EXISTS washes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  branch_id INTEGER,
  customer_id UUID REFERENCES users(id),
  service_id INTEGER REFERENCES services(id),
  car_size VARCHAR(20) NOT NULL CHECK (car_size IN ('small', 'medium', 'suv')),
  price DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'pos', 'online', 'subscription')),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Requests Table
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

-- Offers Table
CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  title_en VARCHAR(255) DEFAULT '',
  title_ar VARCHAR(255) DEFAULT '',
  description_en TEXT,
  description_ar TEXT,
  discount_percentage DECIMAL(5, 2),
  valid_until DATE,
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  branch_id INTEGER,
  expense_type VARCHAR(100),
  content TEXT,
  price NUMERIC(10,2),
  vat_amount NUMERIC(10,2),
  total NUMERIC(10,2),
  invoice_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Balances Table
CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  balance NUMERIC(10,2) DEFAULT 0,
  pending_settlement NUMERIC(10,2) DEFAULT 0,
  last_settlement TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter Businesses Table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(500) DEFAULT '08:00 - 23:00',
ADD COLUMN IF NOT EXISTS map_link TEXT,
ADD COLUMN IF NOT EXISTS logo TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS booking_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS allow_bookings BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);

-- Notifications Table (ensure it exists)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Super Admin (password: admin123)
INSERT INTO users (phone, name, password_hash, role)
VALUES ('0500000000', 'Super Admin', '$2a$10$X7V.j5.X7V.j5.X7V.j5.X7V.j5.X7V.j5.X7V.j5.X7V.j5.X7V.j5', 'super_admin')
ON CONFLICT (phone) DO NOTHING;
