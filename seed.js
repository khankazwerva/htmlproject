const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Очищаем базу
    await Product.deleteMany({});
    await User.deleteMany({});
    
    // Создаем товары
    const products = await Product.insertMany([
      {
        name: "Ноутбук ASUS",
        description: "Мощный игровой ноутбук",
        price: 69999,
        category: "electronics",
        stock: 15,
        image: ""
      },
      {
        name: "Футболка Nike",
        description: "Спортивная футболка",
        price: 1999,
        category: "clothing",
        stock: 30,
        image: ""
      },
      {
        name: "Книга 'JavaScript'",
        description: "Учебник по программированию",
        price: 1299,
        category: "books",
        stock: 25,
        image: ""
      }
    ]);
    
    // Создаем тестового пользователя
    const user = await User.create({
      name: "Тестовый Пользователь",
      email: "test@test.com",
      password: "test123", // Автоматически захешируется
      role: "user"
    });
    
    console.log("✅ Создано товаров:", products.length);
    console.log("✅ Тестовый пользователь: test@test.com / test123");
    
    process.exit();
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
};

seed();