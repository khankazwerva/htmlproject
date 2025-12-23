const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile
} = require('../controllers/authController');

// Публичные маршруты
router.post('/register', register);
router.post('/login', login);

// Защищенные маршруты
router.get('/me', auth, getMe);
router.put('/update', auth, updateProfile);

module.exports = router;