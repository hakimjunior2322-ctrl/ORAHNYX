-- ============================================
-- SALON PREMIUM - SCHEMA BASE DE DONNÉES
-- ============================================

-- USERS (Admin)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SALON CONFIG
CREATE TABLE salon_config (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'Salon Premium',
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#8b7355',
  secondary_color VARCHAR(7) DEFAULT '#d4a574',
  address VARCHAR(500),
  phone VARCHAR(20),
  email VARCHAR(255),
  price_per_km DECIMAL(10, 2) DEFAULT 1.50,
  free_km_threshold DECIMAL(10, 2) DEFAULT 5.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRESTATIONS (Services)
CREATE TABLE prestations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INT NOT NULL,
  image_url VARCHAR(500),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUITS (Boutique)
CREATE TABLE produits (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url VARCHAR(500),
  stock INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CALENDRIER (Disponibilités)
CREATE TABLE calendar_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RÉSERVATIONS
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  prestation_id INT NOT NULL REFERENCES prestations(id),
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  client_address VARCHAR(500),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  location_type VARCHAR(20) NOT NULL, -- 'boutique' ou 'domicile'
  distance_km DECIMAL(10, 2),
  additional_fees DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AVIS CLIENTS
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  reservation_id INT REFERENCES reservations(id),
  client_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TARIFS KILOMÉTRIQUES (Tranches)
CREATE TABLE km_pricing_tiers (
  id SERIAL PRIMARY KEY,
  min_km DECIMAL(10, 2) NOT NULL,
  max_km DECIMAL(10, 2) NOT NULL,
  price_per_km DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LOGS ADMIN
CREATE TABLE admin_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_calendar_date ON calendar_slots(date);
CREATE INDEX idx_reviews_approved ON reviews(is_approved);
CREATE INDEX idx_logs_user ON admin_logs(user_id);
