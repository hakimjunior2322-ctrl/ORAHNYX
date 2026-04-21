const express = require('express');
const router = express.Router();

const { 
  authController, 
  prestationsController,
  produitsController,
  reservationsController,
  kmPricingController,
  reviewsController,
  configController,
  statsController
} = require('../controllers/controllers');

const { authenticate, authorize, validateInput, rateLimit } = require('../middleware/middleware');

// ==================== AUTH ====================
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/logout', authController.logout);

// ==================== STATS (DASHBOARD) ====================
router.get('/stats/dashboard', statsController.getDashboard);

// ==================== PRESTATIONS ====================
router.get('/prestations', prestationsController.getAll);
router.get('/prestations/:id', prestationsController.getById);
router.post('/prestations', prestationsController.create);
router.put('/prestations/:id', prestationsController.update);
router.delete('/prestations/:id', prestationsController.delete);

// ==================== PRODUITS ====================
router.get('/produits', produitsController.getAll);
router.get('/produits/:id', produitsController.getById);
router.post('/produits', produitsController.create);
router.put('/produits/:id', produitsController.update);
router.delete('/produits/:id', produitsController.delete);

// ==================== RESERVATIONS ====================
router.get('/reservations', reservationsController.getAll);
router.get('/reservations/:id', reservationsController.getById);
router.post('/reservations', reservationsController.create);
router.put('/reservations/:id/status', reservationsController.updateStatus);
router.delete('/reservations/:id', reservationsController.delete);

// ==================== KM PRICING ====================
router.get('/km-pricing', kmPricingController.getAll);
router.post('/km-pricing', kmPricingController.create);
router.put('/km-pricing/:id', kmPricingController.update);
router.delete('/km-pricing/:id', kmPricingController.delete);

// ==================== REVIEWS ====================
router.get('/reviews', reviewsController.getAll);
router.put('/reviews/:id/status', reviewsController.updateStatus);
router.delete('/reviews/:id', reviewsController.delete);

// ==================== CONFIG ====================
router.get('/config', configController.get);
router.put('/config', configController.update);

module.exports = router;
