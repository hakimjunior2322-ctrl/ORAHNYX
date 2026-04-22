const express = require('express');
const router = express.Router();
const {
  authController,
  prestationsController,
  produitsController,
  reservationsController,
  configController,
  galerieController,
  pricingConfigController,
  unavailableDatesController
} = require('../controllers/controllers');

// Auth
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/logout', authController.logout);

// Prestations
router.get('/prestations', prestationsController.getAll);
router.get('/prestations/:id', prestationsController.getById);
router.post('/prestations', prestationsController.create);
router.put('/prestations/:id', prestationsController.update);
router.delete('/prestations/:id', prestationsController.delete);

// Produits
router.get('/produits', produitsController.getAll);
router.get('/produits/:id', produitsController.getById);
router.post('/produits', produitsController.create);
router.put('/produits/:id', produitsController.update);
router.delete('/produits/:id', produitsController.delete);

// Reservations
router.get('/reservations', reservationsController.getAll);
router.get('/reservations/:id', reservationsController.getById);
router.post('/reservations', reservationsController.create);
router.put('/reservations/:id/status', reservationsController.updateStatus);
router.delete('/reservations/:id', reservationsController.delete);


// Pricing config
router.get('/pricing-config', pricingConfigController.get);
router.put('/pricing-config', pricingConfigController.update);

// Unavailable dates
router.get('/unavailable-dates', unavailableDatesController.getAll);
router.post('/unavailable-dates', unavailableDatesController.add);
router.delete('/unavailable-dates/:id', unavailableDatesController.delete);


// Config
router.get('/config', configController.get);
router.put('/config', configController.update);

// Routes galerie
router.get('/galerie', galerieController.getAll);
router.post('/galerie', galerieController.create);
router.delete('/galerie/:id', galerieController.delete);


// Horaires
router.get('/horaires', async (req, res) => {
  try {
    const result = await require('../db').query('SELECT * FROM opening_hours ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/horaires', async (req, res) => {
  try {
    const { horaires } = req.body;
    const db = require('../db');
    
    for (let h of horaires) {
      await db.query('UPDATE opening_hours SET hours = $1 WHERE day = $2', [h.hours, h.day]);
    }
    
    res.json({ message: 'Horaires mis à jour' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
