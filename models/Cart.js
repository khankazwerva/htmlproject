const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Количество должно быть не менее 1'],
    default: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Индексы
cartSchema.index({ user: 1 });
cartSchema.index({ updatedAt: -1 });

// Метод для получения количества товаров в корзине
cartSchema.methods.getItemCount = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

// Метод для получения общей стоимости корзины
cartSchema.methods.getTotalAmount = function() {
  return this.items.reduce((total, item) => {
    // Предполагаем, что product будет populated
    if (item.product && typeof item.product.price === 'number') {
      return total + (item.product.price * item.quantity);
    }
    return total;
  }, 0);
};

module.exports = mongoose.model('Cart', cartSchema);