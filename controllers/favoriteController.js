const Favorite = require('../models/Favorite');
const Product = require('../models/Product');

// Получение избранных товаров
exports.getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('product')
      .sort({ createdAt: -1 });

    // Преобразуем в массив продуктов
    const products = favorites.map(fav => fav.product);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// Добавление в избранное
exports.addToFavorites = async (req, res, next) => {
  try {
    const { productId } = req.body;

    // Проверяем существование товара
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Проверяем, не добавлен ли уже товар в избранное
    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      product: productId
    });

    if (existingFavorite) {
      return res.status(400).json({
        error: 'Товар уже в избранном'
      });
    }

    // Добавляем в избранное
    const favorite = await Favorite.create({
      user: req.user._id,
      product: productId
    });

    // Возвращаем populated запись
    const populatedFavorite = await Favorite.findById(favorite._id)
      .populate('product');

    res.status(201).json({
      success: true,
      favorite: populatedFavorite
    });
  } catch (error) {
    next(error);
  }
};

// Удаление из избранного
exports.removeFromFavorites = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      product: productId
    });

    if (!favorite) {
      return res.status(404).json({
        error: 'Товар не найден в избранном'
      });
    }

    res.json({
      success: true,
      message: 'Товар удален из избранного'
    });
  } catch (error) {
    next(error);
  }
};

// Проверка, есть ли товар в избранном
exports.checkFavorite = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const favorite = await Favorite.findOne({
      user: req.user._id,
      product: productId
    });

    res.json({
      success: true,
      isFavorite: !!favorite
    });
  } catch (error) {
    next(error);
  }
};