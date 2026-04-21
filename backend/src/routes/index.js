// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Import contrôleurs
const authController = require('../controllers/authController');
const prestationsController = require('../controllers/prestationsController');
const reservationsController = require('../controllers/reservationsController');
const produitController = require('../controllers/produitController');
const calendarController = require('../controllers/calendarController');
const reviewsController = require('../controllers/reviewsController');
const configController = require('../controllers/configController');
const kmPricingController = require('../controllers/kmPricingController');

// Middleware
const { authenticate, authorize } = require('../middleware/auth');
const { validateInput } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rateLimit');

// ============================================
// AUTH ROUTES
// ============================================
router.post('/auth/login', rateLimit(5, 15), authController.login);
router.post('/auth/register', rateLimit(3, 60), authController.register);
router.post('/auth/logout', authenticate, authController.logout);

// ============================================
// PRESTATIONS (Services)
// ============================================
router.get('/prestations', prestationsController.getAll);
router.get('/prestations/:id', prestationsController.getById);
router.post('/prestations', authenticate, authorize('admin'), validateInput('prestation'), prestationsController.create);
router.put('/prestations/:id', authenticate, authorize('admin'), validateInput('prestation'), prestationsController.update);
router.delete('/prestations/:id', authenticate, authorize('admin'), prestationsController.delete);

// ============================================
// PRODUITS (Boutique)
// ============================================
router.get('/produits', produitController.getAll);
router.get('/produits/:id', produitController.getById);
router.get('/produits/category/:category', produitController.getByCategory);
router.post('/produits', authenticate, authorize('admin'), validateInput('produit'), produitController.create);
router.put('/produits/:id', authenticate, authorize('admin'), validateInput('produit'), produitController.update);
router.delete('/produits/:id', authenticate, authorize('admin'), produitController.delete);

// ============================================
// CALENDRIER & DISPONIBILITÉS
// ============================================
router.get('/calendar/available', calendarController.getAvailableSlots);
router.get('/calendar/slots/:date', calendarController.getSlotsByDate);
router.post('/calendar/block', authenticate, authorize('admin'), calendarController.blockSlot);
router.post('/calendar/unblock', authenticate, authorize('admin'), calendarController.unblockSlot);
router.put('/calendar/hours', authenticate, authorize('admin'), calendarController.setBusinessHours);

// ============================================
// RÉSERVATIONS
// ============================================
router.post('/reservations/calculate', reservationsController.calculatePrice);
router.post('/reservations', validateInput('reservation'), reservationsController.create);
router.get('/reservations/:id', reservationsController.getById);
router.get('/admin/reservations', authenticate, authorize('admin'), reservationsController.getAll);
router.put('/reservations/:id/status', authenticate, authorize('admin'), reservationsController.updateStatus);
router.delete('/reservations/:id', authenticate, authorize('admin'), reservationsController.delete);

// ============================================
// AVIS CLIENTS
// ============================================
router.get('/reviews', reviewsController.getApproved);
router.post('/reviews', validateInput('review'), reviewsController.create);
router.get('/admin/reviews', authenticate, authorize('admin'), reviewsController.getAll);
router.put('/admin/reviews/:id/approve', authenticate, authorize('admin'), reviewsController.approve);
router.delete('/admin/reviews/:id', authenticate, authorize('admin'), reviewsController.delete);

// ============================================
// CONFIGURATION SALON
// ============================================
router.get('/config', configController.get);
router.put('/admin/config', authenticate, authorize('admin'), validateInput('config'), configController.update);

// ============================================
// KILOMÉTRAGE & TARIFS
// ============================================
router.get('/km-pricing', kmPricingController.getAll);
router.post('/km-pricing', authenticate, authorize('admin'), validateInput('kmTier'), kmPricingController.create);
router.put('/km-pricing/:id', authenticate, authorize('admin'), validateInput('kmTier'), kmPricingController.update);
router.delete('/km-pricing/:id', authenticate, authorize('admin'), kmPricingController.delete);

// ============================================
// HEALTH CHECK
// ============================================
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;
