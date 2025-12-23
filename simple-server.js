const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Простые тестовые товары
const testProducts = [
  {
    _id: "1",
    name: "Ноутбук ASUS",
    description: "Мощный игровой ноутбук",
    price: 69999,
    category: "electronics",
    stock: 5,
    image: ""
  },
  {
    _id: "2", 
    name: "Футболка Nike",
    description: "Спортивная футболка",
    price: 1999,
    category: "clothing",
    stock: 20,
    image: ""
  },
  {
    _id: "3",
    name: "Книга 'JavaScript'",
    description: "Учебник по программированию",
    price: 1299,
    category: "books",
    stock: 10,
    image: ""
  }
];

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/products', (req, res) => {
  res.json(testProducts);
});

app.post('/api/auth/login', (req, res) => {
  res.json({ 
    token: 'test-token-123',
    user: { _id: '1', name: 'Тест', email: 'test@test.com', role: 'user' }
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ _id: '1', name: 'Тест', email: 'test@test.com', role: 'user' });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [] });
});

app.get('/api/orders', (req, res) => {
  res.json([]);
});

// Статические файлы
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// Все остальные запросы - на фронтенд
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Откройте: http://localhost:${PORT}`);
});