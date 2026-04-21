const express = require('express');
const router = express.Router();

const { 
  authController, 
  prestationsController, 
  reservationsController
} = require('../controllers/controllers');

const { authenticate, authorize, validateInput, rateLimit } = require('../middleware/middleware');

// AUTH
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/logout', authController.logout);

// PRESTATIONS
router.get('/prestations', prestationsController.getAll);
router.get('/prestations/:id', prestationsController.getById);
router.post('/prestations', prestationsController.create);
router.put('/prestations/:id', prestationsController.update);
router.delete('/prestations/:id', prestationsController.delete);

// RESERVATIONS
router.post('/reservations', reservationsController.create);
router.get('/reservations', reservationsController.getAll);
router.get('/reservations/:id', reservationsController.getById);
router.put('/reservations/:id', reservationsController.updateStatus);
router.delete('/reservations/:id', reservationsController.delete);

module.exports = router;
