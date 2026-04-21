// backend/src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log action
    await db.query(
      'INSERT INTO admin_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [user.rows[0].id, 'LOGIN', req.ip]
    );

    res.json({ token, user: { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name',
      [email, hashedPassword, name, 'admin']
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Déconnecté' });
};

// ============================================
// backend/src/controllers/prestationsController.js
// ============================================
const prestationsController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM prestations WHERE is_active = true ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
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
        [name, description, price, duration_minutes, image_url, category]
      );

      // Log action
      await db.query(
        'INSERT INTO admin_logs (user_id, action, entity_type, entity_id, new_value) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'CREATE', 'prestation', result.rows[0].id, JSON.stringify(result.rows[0])]
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
      const id = req.params.id;

      const result = await db.query(
        'UPDATE prestations SET name = $1, description = $2, price = $3, duration_minutes = $4, image_url = $5, category = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
        [name, description, price, duration_minutes, image_url, category, id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Prestation non trouvée' });

      // Log action
      await db.query(
        'INSERT INTO admin_logs (user_id, action, entity_type, entity_id, new_value) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'UPDATE', 'prestation', id, JSON.stringify(result.rows[0])]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  delete: async (req, res) => {
    try {
      const id = req.params.id;
      await db.query('DELETE FROM prestations WHERE id = $1', [id]);

      // Log action
      await db.query(
        'INSERT INTO admin_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'DELETE', 'prestation', id]
      );

      res.json({ message: 'Prestation supprimée' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ============================================
// backend/src/controllers/reservationsController.js
// ============================================
const reservationsController = {
  calculatePrice: async (req, res) => {
    try {
      const { prestation_id, location_type, client_address } = req.body;

      const prestation = await db.query('SELECT * FROM prestations WHERE id = $1', [prestation_id]);
      if (prestation.rows.length === 0) return res.status(404).json({ error: 'Prestation non trouvée' });

      let totalPrice = prestation.rows[0].price;
      let distance_km = null;
      let additional_fees = 0;

      if (location_type === 'domicile' && client_address) {
        // Calcul distance (simplifié - à remplacer par API réelle)
        distance_km = Math.random() * 20;
        
        const config = await db.query('SELECT * FROM salon_config LIMIT 1');
        const freeKm = config.rows[0]?.free_km_threshold || 5;
        const pricePerKm = config.rows[0]?.price_per_km || 1.5;

        if (distance_km > freeKm) {
          additional_fees = (distance_km - freeKm) * pricePerKm;
        }

        totalPrice += additional_fees;
      }

      res.json({ totalPrice, additional_fees, distance_km, prestation_price: prestation.rows[0].price });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  create: async (req, res) => {
    try {
      const { prestation_id, client_name, client_email, client_phone, client_address, reservation_date, reservation_time, location_type, total_price } = req.body;

      // Validation
      if (!prestation_id || !client_name || !client_email || !client_phone || !reservation_date || !reservation_time) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }

      const result = await db.query(
        'INSERT INTO reservations (prestation_id, client_name, client_email, client_phone, client_address, reservation_date, reservation_time, location_type, total_price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [prestation_id, client_name, client_email, client_phone, client_address || null, reservation_date, reservation_time, location_type, total_price, 'pending']
      );

      // Marquer le créneau comme occupé
      await db.query(
        'UPDATE calendar_slots SET is_available = false WHERE date = $1 AND start_time = $2',
        [reservation_date, reservation_time]
      );

      // Envoyer email (Resend)
      // TODO: Implémenter Resend

      res.status(201).json(result.rows[0]);
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

  getAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM reservations ORDER BY reservation_date DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const id = req.params.id;

      const result = await db.query(
        'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
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

module.exports = { authController, prestationsController, reservationsController };
