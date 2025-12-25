const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.once('open', () => {
  console.log('✅ Подключение к MongoDB установлено');
});

// Модели
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' }
});

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  stock: Number,
  image: String
});

// УПРОЩЕННАЯ модель корзины - будем хранить товары как объекты
const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    image: String,
    quantity: { type: Number, default: 1, min: 1 }
  }],
  updatedAt: { type: Date, default: Date.now }
});

const FavoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  status: { type: String, default: 'pending', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
  shippingAddress: {
    street: String,
    city: String,
    postalCode: String
  },
  paymentMethod: { type: String, default: 'cash' },
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Cart = mongoose.model('Cart', CartSchema);
const Favorite = mongoose.model('Favorite', FavoriteSchema);
const Order = mongoose.model('Order', OrderSchema);

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Неверный токен' });
    }
    req.user = user;
    next();
  });
};

// ====== АВТОРИЗАЦИЯ ======
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: email === 'admin@example.com' ? 'admin' : 'user'
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/auth/update', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ====== ТОВАРЫ ======
app.get('/api/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, sort } = req.query;
    
    let query = {};
    
    if (category) query.category = category;
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let products = Product.find(query);
    
    if (sort) {
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      products = products.sort({ [sortField]: sortOrder });
    }
    
    const result = await products.exec();
    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    // Удаляем товар из корзин и избранного
    await Cart.updateMany(
      { 'items.productId': req.params.id },
      { $pull: { items: { productId: req.params.id } } }
    );
    
    await Favorite.deleteMany({ productId: req.params.id });
    
    res.json({ message: 'Товар удален' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ====== КОРЗИНА (УПРОЩЕННАЯ ВЕРСИЯ) ======
// Получение корзины пользователя
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение количества товаров в корзине
app.get('/api/cart/count', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      return res.json({ count: 0 });
    }
    
    const count = cart.items.reduce((total, item) => total + item.quantity, 0);
    res.json({ count });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавление товара в корзину
app.post('/api/cart', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    // Получаем данные товара
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Недостаточно товара в наличии' });
    }
    
    // Находим или создаем корзину
    let cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
    }
    
    // Проверяем, есть ли товар уже в корзине
    const existingItemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId.toString()
    );
    
    if (existingItemIndex > -1) {
      // Обновляем количество
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Добавляем новый товар
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity
      });
    }
    
    cart.updatedAt = new Date();
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление количества товара в корзине
app.put('/api/cart/:productId', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;
    
    if (quantity <= 0) {
      // Удаляем товар из корзины
      const cart = await Cart.findOneAndUpdate(
        { userId: req.user.userId },
        { $pull: { items: { productId: productId } } },
        { new: true }
      );
      
      if (!cart) {
        return res.status(404).json({ error: 'Корзина не найдена' });
      }
      
      return res.json(cart);
    }
    
    // Обновляем количество
    const cart = await Cart.findOneAndUpdate(
      { 
        userId: req.user.userId,
        'items.productId': productId 
      },
      { 
        $set: { 
          'items.$.quantity': quantity,
          updatedAt: new Date()
        } 
      },
      { new: true }
    );
    
    if (!cart) {
      return res.status(404).json({ error: 'Товар не найден в корзине' });
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Update cart quantity error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление товара из корзины
app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { $pull: { items: { productId: req.params.productId } } },
      { new: true }
    );
    
    if (!cart) {
      return res.status(404).json({ error: 'Корзина не найдена' });
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Очистка корзины
app.delete('/api/cart', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [], updatedAt: new Date() },
      { new: true }
    );
    
    if (!cart) {
      return res.status(404).json({ error: 'Корзина не найдена' });
    }
    
    res.json({ message: 'Корзина очищена' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ====== ИЗБРАННОЕ ======
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.userId })
      .populate('productId')
      .lean();
    
    const formattedFavorites = favorites.map(fav => ({
      _id: fav.productId._id,
      name: fav.productId.name,
      description: fav.productId.description,
      price: fav.productId.price,
      category: fav.productId.category,
      stock: fav.productId.stock,
      image: fav.productId.image
    }));
    
    res.json(formattedFavorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    const existingFavorite = await Favorite.findOne({
      userId: req.user.userId,
      productId
    });
    
    if (existingFavorite) {
      return res.status(400).json({ error: 'Товар уже в избранном' });
    }
    
    const favorite = new Favorite({
      userId: req.user.userId,
      productId
    });
    
    await favorite.save();
    
    res.json({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image: product.image
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/favorites/:productId', authenticateToken, async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      userId: req.user.userId,
      productId: req.params.productId
    });
    
    if (!favorite) {
      return res.status(404).json({ error: 'Товар не найден в избранном' });
    }
    
    res.json({ message: 'Товар удален из избранного' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ====== ЗАКАЗЫ ======
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    let orders;
    
    if (req.user.role === 'admin') {
      orders = await Order.find()
        .populate('items.productId')
        .sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ userId: req.user.userId })
        .populate('items.productId')
        .sort({ createdAt: -1 });
    }
    
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/orders/my', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate('items.productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создание заказа - УПРОЩЕННАЯ ВЕРСИЯ
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod, customerInfo } = req.body;
    
    // Проверяем наличие товаров
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }
    
    // Простая проверка формата
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price || !item.name) {
        console.error('Invalid item format:', item);
        return res.status(400).json({ error: 'Неверный формат данных товара' });
      }
    }
    
    const order = new Order({
      userId: req.user.userId,
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      totalAmount,
      shippingAddress,
      paymentMethod,
      customerInfo
    });
    
    await order.save();
    
    // Обновляем остатки товаров
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }
    
    // Очищаем корзину
    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [] }
    );
    
    res.json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ====== ЗАГРУЗКА ТЕСТОВЫХ ДАННЫХ ======
app.post('/api/seed', async (req, res) => {
  try {
    console.log('Начинаю загрузку тестовых данных...');
    
    // Очистка базы данных
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Favorite.deleteMany({});
    await Order.deleteMany({});
    
    console.log('База данных очищена');
    
    // Создание тестового админа
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Администратор',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });
    await admin.save();
    
    // Создание тестового пользователя
    const userPassword = await bcrypt.hash('user123', 10);
    const user = new User({
      name: 'Тестовый Пользователь',
      email: 'user@example.com',
      password: userPassword,
      role: 'user'
    });
    await user.save();
    
    console.log('Тестовые пользователи созданы');
    
    // Создание тестовых товаров
    const products = [
      {
        name: 'Смартфон Samsung Galaxy S23',
        description: 'Новый флагманский смартфон с мощным процессором и отличной камерой',
        price: 89999,
        category: 'electronics',
        stock: 15,
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Ноутбук Apple MacBook Air M2',
        description: 'Легкий и мощный ноутбук с процессором Apple M2',
        price: 129999,
        category: 'electronics',
        stock: 8,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Футболка мужская',
        description: 'Хлопковая футболка премиум качества',
        price: 2499,
        category: 'clothing',
        stock: 50,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Книга "Мастер и Маргарита"',
        description: 'Роман Михаила Булгакова в подарочном издании',
        price: 899,
        category: 'books',
        stock: 25,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'Кофе в зернах',
        description: 'Арабика 100%, свежая обжарка',
        price: 1499,
        category: 'food',
        stock: 100,
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      }
    ];
    
    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
      console.log(`Товар "${productData.name}" создан`);
    }
    
    console.log('Тестовые товары созданы');
    
    res.json({ 
      message: 'Тестовые данные загружены',
      admin: { email: 'admin@example.com', password: 'admin123' },
      user: { email: 'user@example.com', password: 'user123' }
    });
  } catch (error) {
    console.error('Ошибка загрузки тестовых данных:', error);
    res.status(500).json({ error: 'Ошибка загрузки тестовых данных' });
  }
});

// ====== ЗАПУСК СЕРВЕРА ======
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 API доступен по адресу: http://localhost:${PORT}`);
  console.log(`📊 Для загрузки тестовых данных отправьте POST запрос на: http://localhost:${PORT}/api/seed`);
});