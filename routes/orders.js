const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');

// Маршруты для пользователей
router.use(auth);

router.post('/', createOrder);
router.get('/my', getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

// Маршруты для администраторов
router.get('/', isAdmin, getAllOrders);
router.put('/:id/status', isAdmin, updateOrderStatus);

module.exports = router;