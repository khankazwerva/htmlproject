const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-shop');
    
    // Модели (те же, что в server.js)
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: { type: String, default: 'user' }
    }));

    const Product = mongoose.model('Product', new mongoose.Schema({
      name: String,
      description: String,
      price: Number,
      category: String,
      stock: Number,
      image: String
    }));

    // Очистка базы данных
    await User.deleteMany({});
    await Product.deleteMany({});
    
    console.log('🗑️  База данных очищена');

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
    
    console.log('👥 Тестовые пользователи созданы');

    // Создание тестовых товаров
    const products = [
      {
        name: 'Смартфон Samsung Galaxy S23',
        description: 'Новый флагманский смартфон с мощным процессором и отличной камерой',
        price: 89999,
        category: 'electronics',
        stock: 15,
        image: 'https://via.placeholder.com/300x300/3498db/ffffff?text=Samsung+S23'
      },
      {
        name: 'Ноутбук Apple MacBook Air M2',
        description: 'Легкий и мощный ноутбук с процессором Apple M2',
        price: 129999,
        category: 'electronics',
        stock: 8,
        image: 'https://via.placeholder.com/300x300/2ecc71/ffffff?text=MacBook+Air+M2'
      },
      {
        name: 'Футболка мужская',
        description: 'Хлопковая футболка премиум качества',
        price: 2499,
        category: 'clothing',
        stock: 50,
        image: 'https://via.placeholder.com/300x300/e74c3c/ffffff?text=T-Shirt'
      },
      {
        name: 'Книга "Мастер и Маргарита"',
        description: 'Роман Михаила Булгакова в подарочном издании',
        price: 899,
        category: 'books',
        stock: 25,
        image: 'https://via.placeholder.com/300x300/9b59b6/ffffff?text=Book'
      },
      {
        name: 'Кофе в зернах',
        description: 'Арабика 100%, свежая обжарка',
        price: 1499,
        category: 'food',
        stock: 100,
        image: 'https://via.placeholder.com/300x300/f39c12/ffffff?text=Coffee'
      }
    ];
    
    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Товар "${productData.name}" создан`);
    }
    
    console.log('🎉 Тестовые данные успешно загружены!');
    console.log('\n📋 Тестовые учетные записи:');
    console.log('Администратор: admin@example.com / admin123');
    console.log('Пользователь: user@example.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

seedData();