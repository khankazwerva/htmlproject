const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Генерация JWT токена
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Регистрация пользователя
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Создаем пользователя
    const user = await User.create({
      name,
      email,
      password
    });

    // Генерируем токен
    const token = generateToken(user._id);

    // Отправляем ответ
    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Вход пользователя
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Проверяем email и пароль
    if (!email || !password) {
      return res.status(400).json({
        error: 'Пожалуйста, введите email и пароль'
      });
    }

    // Ищем пользователя с включенным паролем
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Неверный email или пароль'
      });
    }

    // Проверяем пароль
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        error: 'Неверный email или пароль'
      });
    }

    // Генерируем токен
    const token = generateToken(user._id);

    // Отправляем ответ
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получение данных текущего пользователя
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Обновление профиля пользователя
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    // Проверяем, не занят ли email другим пользователем
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: 'Пользователь с таким email уже существует'
        });
      }
    }

    // Обновляем пользователя
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};