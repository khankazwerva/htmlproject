const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const createProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Удаляем старые товары
    await Product.deleteMany({});
    
    // Создаем новые товары
    const products = await Product.insertMany([
      {
        name: "Ноутбук ASUS VivoBook",
        description: "15.6 дюймов, Intel Core i5, 8GB RAM, 512GB SSD",
        price: 54999,
        category: "electronics",
        stock: 10
      },
      {
        name: "Футболка мужская",
        description: "Хлопковая футболка, размеры S-XXL",
        price: 1299,
        category: "clothing",
        stock: 50
      },
      {
        name: "Книга 'JavaScript для начинающих'",
        description: "Подробный учебник по JavaScript",
        price: 890,
        category: "books",
        stock: 25
      },
      {
        name: "Кофе в зернах",
        description: "Арабика, 1 кг, свежей обжарки",
        price: 1499,
        category: "food",
        stock: 100
      },
      {
        name: "Смартфон Samsung",
        description: "6.5 дюймов, 128GB, 8GB RAM",
        price: 34999,
        category: "electronics",
        stock: 15
      }
    ]);
    
    console.log(`✅ Создано ${products.length} товаров!`);
    console.log("📦 Товары:");
    products.forEach(p => console.log(`- ${p.name}: ${p.price} руб.`));
    
    process.exit();
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
};

createProducts();