// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token invalide' });
  }
};

exports.authorize = (requiredRole) => {
  return (req, res, next) => {
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    next();
  };
};

// ============================================
// backend/src/middleware/validation.js
// ============================================
const validateInput = (type) => {
  return (req, res, next) => {
    const { body } = req;

    const validators = {
      prestation: () => {
        if (!body.name || !body.price || !body.duration_minutes) {
          return 'Nom, prix et durée requis';
        }
        if (typeof body.price !== 'number' || body.price <= 0) {
          return 'Prix invalide';
        }
        if (typeof body.duration_minutes !== 'number' || body.duration_minutes <= 0) {
          return 'Durée invalide';
        }
        return null;
      },

      produit: () => {
        if (!body.name || !body.price || !body.category) {
          return 'Nom, prix et catégorie requis';
        }
        if (typeof body.price !== 'number' || body.price <= 0) {
          return 'Prix invalide';
        }
        return null;
      },

      reservation: () => {
        if (!body.prestation_id || !body.client_name || !body.client_email || !body.client_phone) {
          return 'Données client manquantes';
        }
        if (!body.reservation_date || !body.reservation_time) {
          return 'Date et heure requises';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.client_email)) {
          return 'Email invalide';
        }
        return null;
      },

      review: () => {
        if (!body.client_name || !body.rating || !body.comment) {
          return 'Données manquantes';
        }
        if (body.rating < 1 || body.rating > 5) {
          return 'Note invalide (1-5)';
        }
        return null;
      },

      config: () => {
        if (body.price_per_km && typeof body.price_per_km !== 'number') {
          return 'Prix/km invalide';
        }
        return null;
      },

      kmTier: () => {
        if (!body.min_km || !body.max_km || !body.price_per_km) {
          return 'Données incomplètes';
        }
        if (body.min_km >= body.max_km) {
          return 'Plage km invalide';
        }
        return null;
      }
    };

    const error = validators[type]?.();
    if (error) {
      return res.status(400).json({ error });
    }

    next();
  };
};

// ============================================
// backend/src/middleware/rateLimit.js
// ============================================
const rateLimit = (maxRequests, windowSeconds) => {
  const requestCounts = {};

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (!requestCounts[ip]) {
      requestCounts[ip] = [];
    }

    // Nettoyer les anciennes requêtes
    requestCounts[ip] = requestCounts[ip].filter(time => now - time < windowSeconds * 1000);

    if (requestCounts[ip].length >= maxRequests) {
      return res.status(429).json({ error: 'Trop de requêtes. Réessayez plus tard.' });
    }

    requestCounts[ip].push(now);
    next();
  };
};

// ============================================
// backend/src/middleware/xssCsrf.js
// ============================================
const sanitize = (input) => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const xssProtection = (req, res, next) => {
  // Sanitize body
  Object.keys(req.body).forEach(key => {
    if (typeof req.body[key] === 'string') {
      req.body[key] = sanitize(req.body[key]);
    }
  });

  // CSRF Token (simplifié)
  if (!req.headers['x-csrf-token'] && req.method !== 'GET') {
    // Optionnel: vérifier le token CSRF
  }

  next();
};

module.exports = {
  validateInput,
  rateLimit,
  xssProtection
};
