const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite
} = require('../controllers/favoriteController');

// Все маршруты требуют авторизации
router.use(auth);

router.get('/', getFavorites);
router.post('/', addToFavorites);
router.delete('/:productId', removeFromFavorites);
router.get('/check/:productId', checkFavorite);

module.exports = router;