const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Составной уникальный индекс - один товар может быть в избранном у пользователя только один раз
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });
favoriteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema);