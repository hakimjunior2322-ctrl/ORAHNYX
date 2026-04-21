const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// ==================== AUTH ====================
const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

      const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length === 0) return res.status(401).json({ error: 'Identifiants invalides' });

      const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
      if (!validPassword) return res.status(401).json({ error: 'Identifiants invalides' });

      const token = jwt.sign(
        { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  register: async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) return res.status(400).json({ error: 'Tous les champs sont requis' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name',
        [email, hashedPassword, name, 'admin']
      );

      res.status(201).json({ user: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  logout: (req, res) => res.json({ message: 'Déconnecté' })
};

// ==================== PRESTATIONS ====================
const prestationsController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM prestations ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM prestations WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Prestation non trouvée' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, price, duration_minutes, image_url, category } = req.body;
      
      const result = await db.query(
        'INSERT INTO prestations (name, description, price, duration_minutes, image_url, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, description, price, duration_minutes, image_url || null, category]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  update: async (req, res) => {
    try {
      const { name, description, price, duration_minutes, image_url, category } = req.body;
      const result = await db.query(
        'UPDATE prestations SET name = $1, description = $2, price = $3, duration_minutes = $4, image_url = $5, category = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
        [name, description, price, duration_minutes, image_url, category, req.params.id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Prestation non trouvée' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  delete: async (req, res) => {
    try {
      await db.query('DELETE FROM prestations WHERE id = $1', [req.params.id]);
      res.json({ message: 'Prestation supprimée' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ==================== PRODUITS ====================
const produitsController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM produits ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM produits WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, price, stock, category, image_url } = req.body;
      
      const result = await db.query(
        'INSERT INTO produits (name, description, price, stock, category, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, description, price, stock || 0, category, image_url || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  update: async (req, res) => {
    try {
      const { name, description, price, stock, category, image_url } = req.body;
      const result = await db.query(
        'UPDATE produits SET name = $1, description = $2, price = $3, stock = $4, category = $5, image_url = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
        [name, description, price, stock, category, image_url, req.params.id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  delete: async (req, res) => {
    try {
      await db.query('DELETE FROM produits WHERE id = $1', [req.params.id]);
      res.json({ message: 'Produit supprimé' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ==================== RESERVATIONS ====================
const reservationsController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT r.*, p.name as prestation_name, p.price as prestation_price 
        FROM reservations r 
        LEFT JOIN prestations p ON r.prestation_id = p.id 
        ORDER BY r.reservation_date DESC, r.reservation_time DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM reservations WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Réservation non trouvée' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  create: async (req, res) => {
    try {
      const { prestation_id, client_name, client_email, client_phone, client_address, reservation_date, reservation_time, location_type, total_price } = req.body;

      if (!prestation_id || !client_name || !client_email || !client_phone || !reservation_date || !reservation_time) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }

      const result = await db.query(
        'INSERT INTO reservations (prestation_id, client_name, client_email, client_phone, client_address, reservation_date, reservation_time, location_type, total_price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [prestation_id, client_name, client_email, client_phone, client_address || null, reservation_date, reservation_time, location_type, total_price, 'pending']
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const result = await db.query(
        'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, req.params.id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Réservation non trouvée' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  delete: async (req, res) => {
    try {
      await db.query('DELETE FROM reservations WHERE id = $1', [req.params.id]);
      res.json({ message: 'Réservation supprimée' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ==================== KM PRICING ====================
const kmPricingController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM km_pricing_tiers ORDER BY min_km');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  create: async (req, res) => {
    try {
      const { min_km, max_km, price_per_km } = req.body;
      const result = await db.query(
        'INSERT INTO km_pricing_tiers (min_km, max_km, price_per_km) VALUES ($1, $2, $3) RETURNING *',
        [min_km, max_km, price_per_km]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  update: async (req, res) => {
    try {
      const { min_km, max_km, price_per_km } = req.body;
      const result = await db.query(
        'UPDATE km_pricing_tiers SET min_km = $1, max_km = $2, price_per_km = $3 WHERE id = $4 RETURNING *',
        [min_km, max_km, price_per_km, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Tarif non trouvé' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  delete: async (req, res) => {
    try {
      await db.query('DELETE FROM km_pricing_tiers WHERE id = $1', [req.params.id]);
      res.json({ message: 'Tarif supprimé' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ==================== REVIEWS ====================
const reviewsController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM reviews ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const result = await db.query(
        'UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *',
        [status, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Avis non trouvé' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  delete: async (req, res) => {
    try {
      await db.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
      res.json({ message: 'Avis supprimé' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ==================== CONFIG ====================
const configController = {
  get: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM salon_config LIMIT 1');
      res.json(result.rows[0] || {});
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  update: async (req, res) => {
    try {
      const { salon_name, salon_email, salon_phone, salon_address, primary_color, secondary_color } = req.body;
      
      const existing = await db.query('SELECT * FROM salon_config LIMIT 1');
      
      let result;
      if (existing.rows.length === 0) {
        result = await db.query(
          'INSERT INTO salon_config (salon_name, salon_email, salon_phone, salon_address, primary_color, secondary_color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [salon_name, salon_email, salon_phone, salon_address, primary_color, secondary_color]
        );
      } else {
        result = await db.query(
          'UPDATE salon_config SET salon_name = $1, salon_email = $2, salon_phone = $3, salon_address = $4, primary_color = $5, secondary_color = $6 WHERE id = $7 RETURNING *',
          [salon_name, salon_email, salon_phone, salon_address, primary_color, secondary_color, existing.rows[0].id]
        );
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ==================== STATS ====================
const statsController = {
  getDashboard: async (req, res) => {
    try {
      // Total reservations
      const totalReservations = await db.query('SELECT COUNT(*) as count FROM reservations');
      
      // Reservations this month
      const thisMonth = await db.query(`
        SELECT COUNT(*) as count FROM reservations 
        WHERE EXTRACT(MONTH FROM reservation_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM reservation_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      `);
      
      // Revenue this month
      const revenue = await db.query(`
        SELECT SUM(total_price) as total FROM reservations 
        WHERE status = 'confirmed'
        AND EXTRACT(MONTH FROM reservation_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM reservation_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      `);
      
      // Pending reservations
      const pending = await db.query("SELECT COUNT(*) as count FROM reservations WHERE status = 'pending'");
      
      // Recent reservations
      const recent = await db.query(`
        SELECT r.*, p.name as prestation_name 
        FROM reservations r 
        LEFT JOIN prestations p ON r.prestation_id = p.id 
        ORDER BY r.created_at DESC LIMIT 5
      `);
      
      res.json({
        totalReservations: parseInt(totalReservations.rows[0].count),
        thisMonthReservations: parseInt(thisMonth.rows[0].count),
        thisMonthRevenue: parseFloat(revenue.rows[0].total || 0),
        pendingReservations: parseInt(pending.rows[0].count),
        recentReservations: recent.rows
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

module.exports = { 
  authController, 
  prestationsController,
  produitsController,
  reservationsController,
  kmPricingController,
  reviewsController,
  configController,
  statsController
};
