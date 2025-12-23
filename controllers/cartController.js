const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Получение корзины пользователя
exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price image stock category'
      });

    if (!cart) {
      // Если корзины нет, создаем пустую
      const newCart = await Cart.create({ 
        user: req.user._id,
        items: [] 
      });
      
      return res.json({
        success: true,
        cart: newCart
      });
    }

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    next(error);
  }
};

// Получение количества товаров в корзине
exports.getCartCount = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    let count = 0;
    if (cart && cart.items) {
      count = cart.items.reduce((total, item) => total + item.quantity, 0);
    }

    res.json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
};

// Добавление товара в корзину
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Проверяем существование товара
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Проверяем наличие товара
    if (product.stock < quantity) {
      return res.status(400).json({
        error: 'Недостаточно товара на складе'
      });
    }

    // Находим или создаем корзину
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = await Cart.create({ 
        user: req.user._id,
        items: [] 
      });
    }

    // Проверяем, есть ли уже этот товар в корзине
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      // Увеличиваем количество
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Добавляем новый товар
      cart.items.push({ product: productId, quantity });
    }

    // Обновляем дату изменения
    cart.updatedAt = Date.now();
    
    await cart.save();

    // Возвращаем обновленную корзину с populated продуктами
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price image stock category'
      });

    res.json({
      success: true,
      cart: updatedCart
    });
  } catch (error) {
    next(error);
  }
};

// Обновление количества товара в корзине
exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        error: 'Количество должно быть не менее 1'
      });
    }

    // Проверяем существование товара и наличие на складе
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        error: 'Недостаточно товара на складе'
      });
    }

    // Находим корзину
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        error: 'Корзина не найдена'
      });
    }

    // Находим товар в корзине
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        error: 'Товар не найден в корзине'
      });
    }

    // Обновляем количество
    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = Date.now();
    
    await cart.save();

    // Возвращаем обновленную корзину
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price image stock category'
      });

    res.json({
      success: true,
      cart: updatedCart
    });
  } catch (error) {
    next(error);
  }
};

// Удаление товара из корзины
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        error: 'Корзина не найдена'
      });
    }

    // Фильтруем товары, удаляя нужный
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );
    
    cart.updatedAt = Date.now();
    await cart.save();

    res.json({
      success: true,
      message: 'Товар удален из корзины',
      cart
    });
  } catch (error) {
    next(error);
  }
};

// Очистка корзины
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (cart) {
      cart.items = [];
      cart.updatedAt = Date.now();
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Корзина очищена'
    });
  } catch (error) {
    next(error);
  }
};