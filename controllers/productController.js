const Product = require('../models/Product');

// Получение всех товаров с фильтрацией и сортировкой
exports.getProducts = async (req, res, next) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      sort,
      page = 1,
      limit = 100
    } = req.query;

    // Создаем объект для фильтрации
    const filter = {};

    // Фильтр по категории
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Поиск по тексту
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Сортировка
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case 'name':
          sortOption.name = 1;
          break;
        case '-name':
          sortOption.name = -1;
          break;
        case 'price':
          sortOption.price = 1;
          break;
        case '-price':
          sortOption.price = -1;
          break;
        case 'newest':
          sortOption.createdAt = -1;
          break;
        default:
          sortOption.createdAt = -1;
      }
    } else {
      sortOption.createdAt = -1;
    }

    // Пагинация
    const skip = (Number(page) - 1) * Number(limit);

    // Получаем товары
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    // Получаем общее количество для пагинации
    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products
    });
  } catch (error) {
    next(error);
  }
};

// Получение одного товара по ID
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// Создание товара (админ)
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    
    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// Обновление товара (админ)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// Удаление товара (админ)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Товар успешно удален'
    });
  } catch (error) {
    next(error);
  }
};