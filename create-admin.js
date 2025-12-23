const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Проверяем, существует ли уже админ
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log("✅ Администратор уже существует:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Пароль: admin123 (используйте этот пароль)`);
      process.exit();
    }
    
    // Создаем администратора
    const admin = await User.create({
      name: "Администратор",
      email: "admin@example.com",
      password: "admin123", // Будет автоматически захеширован
      role: "admin"
    });
    
    console.log("✅ Администратор создан!");
    console.log("👑 Логин: admin@example.com");
    console.log("🔑 Пароль: admin123");
    
    process.exit();
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
};

createAdmin();