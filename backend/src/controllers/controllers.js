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

      const token = jwt.sign({ id: user.rows[0].id, email: user.rows[0].email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  register: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

      const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) return res.status(400).json({ error: 'Email déjà utilisé' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
        [email, hashedPassword]
      );

      const token = jwt.sign({ id: result.rows[0].id, email: result.rows[0].email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  logout: async (req, res) => {
    res.json({ message: 'Déconnexion réussie' });
  }
};

// PRESTATIONS
const prestationsController = {
    getAll: async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM prestations ORDER BY price ASC');
            res.json(result.rows);
        } catch (error) {
            console.error('Erreur getAll prestations:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query('SELECT * FROM prestations WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Prestation non trouvée' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Erreur getById prestation:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },
    create: async (req, res) => {
        try {
            const { name, description, price, duration_minutes, category, image_url } = req.body;
            const result = await db.query(
                'INSERT INTO prestations (name, description, price, duration_minutes, category, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [name, description, price, duration_minutes, category, image_url]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Erreur create prestation:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, price, duration_minutes, category, image_url } = req.body;
            const result = await db.query(
                'UPDATE prestations SET name=$1, description=$2, price=$3, duration_minutes=$4, category=$5, image_url=$6 WHERE id=$7 RETURNING *',
                [name, description, price, duration_minutes, category, image_url, id]
            );
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Erreur update prestation:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM prestations WHERE id=$1', [id]);
            res.json({ message: 'Prestation supprimée' });
        } catch (error) {
            console.error('Erreur delete prestation:', error);
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
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM produits WHERE id = $1', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, price, stock, category, image_url } = req.body;
      const result = await db.query(
        'INSERT INTO produits (name, description, price, stock, category, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, description, price, stock || 0, category, image_url]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, stock, category, image_url } = req.body;
      const result = await db.query(
        'UPDATE produits SET name = $1, description = $2, price = $3, stock = $4, category = $5, image_url = $6 WHERE id = $7 RETURNING *',
        [name, description, price, stock, category, image_url, id]
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
      const { id } = req.params;
      await db.query('DELETE FROM produits WHERE id = $1', [id]);
      res.json({ message: 'Produit supprimé' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ==================== RESERVATIONS ====================
const reservationsController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM reservations ORDER BY reservation_date DESC');
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM reservations WHERE id = $1', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Réservation non trouvée' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  create: async (req, res) => {
    try {
      const { client_name, client_email, client_phone, reservation_date, notes } = req.body;
      const result = await db.query(
        'INSERT INTO reservations (client_name, client_email, client_phone, reservation_date, notes, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [client_name, client_email, client_phone, reservation_date, notes, 'pending']
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await db.query(
        'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Réservation non trouvée' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM reservations WHERE id = $1', [id]);
      res.json({ message: 'Réservation supprimée' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ==================== CONFIG ====================
const configController = {
  get: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM salon_config LIMIT 1');
      if (result.rows.length === 0) {
        return res.json({ salon_name: '', salon_email: '', salon_phone: '', salon_address: '' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  update: async (req, res) => {
    try {
      const { salon_name, salon_email, salon_phone, salon_address } = req.body;
      
      const existing = await db.query('SELECT * FROM salon_config LIMIT 1');
      
      if (existing.rows.length === 0) {
        const result = await db.query(
          'INSERT INTO salon_config (salon_name, salon_email, salon_phone, salon_address) VALUES ($1, $2, $3, $4) RETURNING *',
          [salon_name, salon_email, salon_phone, salon_address]
        );
        return res.json(result.rows[0]);
      }
      
      const result = await db.query(
        'UPDATE salon_config SET salon_name = $1, salon_email = $2, salon_phone = $3, salon_address = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [salon_name, salon_email, salon_phone, salon_address, existing.rows[0].id]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ==================== GALERIE CONTROLLER ====================
const galerieController = {
  async getAll(req, res) {
    try {
      const result = await db.query('SELECT * FROM gallery ORDER BY created_at DESC');  // <-- db, pas pool
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  async create(req, res) {
    try {
      const { image_url } = req.body;
      const result = await db.query(
        'INSERT INTO gallery (image_url) VALUES ($1) RETURNING *',
        [image_url]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM gallery WHERE id = $1', [id]);  // <-- db, pas pool
      res.json({ message: 'Image supprimée' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// PRICING CONFIG
const pricingConfigController = {
    get: async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM pricing_config LIMIT 1');
            res.json(result.rows[0] || { price_per_km: 4.00 });
        } catch (error) {
            console.error('Erreur get pricing:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },
    update: async (req, res) => {
        try {
            const { price_per_km } = req.body;
            await db.query('UPDATE pricing_config SET price_per_km = $1, updated_at = CURRENT_TIMESTAMP', [price_per_km]);
            res.json({ price_per_km });
        } catch (error) {
            console.error('Erreur update pricing:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
};

// UNAVAILABLE DATES
const unavailableDatesController = {
    getAll: async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM unavailable_dates ORDER BY date ASC');
            res.json(result.rows);
        } catch (error) {
            console.error('Erreur get unavailable dates:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },
    add: async (req, res) => {
        try {
            const { date, reason } = req.body;
            const result = await db.query(
                'INSERT INTO unavailable_dates (date, reason) VALUES ($1, $2) RETURNING *',
                [date, reason || 'Fermé']
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Erreur add unavailable date:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM unavailable_dates WHERE id = $1', [id]);
            res.json({ message: 'Date supprimée' });
        } catch (error) {
            console.error('Erreur delete unavailable date:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
};



module.exports = {
  authController,
  prestationsController,
  produitsController,
  reservationsController,
  configController,
  galerieController,
  pricingConfigController,
  unavailableDatesController
};
