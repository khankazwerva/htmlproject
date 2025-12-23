const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название товара обязательно'],
    trim: true,
    minlength: [3, 'Название должно содержать минимум 3 символа'],
    maxlength: [100, 'Название должно содержать максимум 100 символов']
  },
  description: {
    type: String,
    required: [true, 'Описание товара обязательно'],
    trim: true,
    minlength: [10, 'Описание должно содержать минимум 10 символов'],
    maxlength: [2000, 'Описание должно содержать максимум 2000 символов']
  },
  price: {
    type: Number,
    required: [true, 'Цена обязательна'],
    min: [0, 'Цена не может быть отрицательной'],
    max: [1000000, 'Цена не может превышать 1,000,000']
  },
  category: {
    type: String,
    required: [true, 'Категория обязательна'],
    enum: {
      values: ['electronics', 'clothing', 'books', 'food', 'other'],
      message: 'Недопустимая категория товара'
    },
    index: true
  },
  stock: {
    type: Number,
    required: [true, 'Количество товара обязательно'],
    min: [0, 'Количество не может быть отрицательным'],
    default: 0
  },
  image: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true; // Пустая строка допустима
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'URL изображения должен быть корректной ссылкой'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ createdAt: -1 });

// Виртуальное поле для проверки наличия товара
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

module.exports = mongoose.model('Product', productSchema);