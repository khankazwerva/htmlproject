const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getCart,
  getCartCount,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

// Все маршруты требуют авторизации
router.use(auth);

router.get('/', getCart);
router.get('/count', getCartCount);
router.post('/', addToCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;