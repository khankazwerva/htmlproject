const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Создание заказа
exports.createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      customerInfo,
      notes
    } = req.body;

    // Проверяем корзину пользователя
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        error: 'Корзина пуста'
      });
    }

    // Проверяем наличие товаров и обновляем остатки
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          error: `Товар "${product.name}" недоступен в нужном количестве`
        });
      }

      // Резервируем товар
      product.stock -= cartItem.quantity;
      await product.save();
    }

    // Создаем массив items для заказа
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price
    }));

    // Рассчитываем общую сумму
    const totalAmount = orderItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Создаем заказ
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress: shippingAddress || null,
      paymentMethod: paymentMethod || 'cash',
      customerInfo: {
        name: customerInfo?.name || req.user.name,
        email: customerInfo?.email || req.user.email,
        phone: customerInfo?.phone || ''
      },
      notes: notes || '',
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Очищаем корзину после создания заказа
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], updatedAt: Date.now() }
    );

    // Возвращаем заказ с populated продуктами
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name price image')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      order: populatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// Получение заказов пользователя
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name price image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// Получение заказа по ID
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name price image')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        error: 'Заказ не найден'
      });
    }

    // Проверяем, что заказ принадлежит пользователю или пользователь - админ
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// Отмена заказа
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        error: 'Заказ не найден'
      });
    }

    // Проверяем, что заказ принадлежит пользователю
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    // Проверяем, можно ли отменить заказ
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        error: 'Невозможно отменить заказ в текущем статусе'
      });
    }

    // Возвращаем товары на склад
    for (const item of order.items) {
      if (item.product) {
        const product = await Product.findById(item.product._id);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    // Обновляем статус заказа
    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    res.json({
      success: true,
      message: 'Заказ отменен',
      order
    });
  } catch (error) {
    next(error);
  }
};

// Получение всех заказов (админ)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('items.product', 'name price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      orders
    });
  } catch (error) {
    next(error);
  }
};

// Обновление статуса заказа (админ)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        error: 'Заказ не найден'
      });
    }

    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    res.json({
      success: true,
      message: 'Статус заказа обновлен',
      order
    });
  } catch (error) {
    next(error);
  }
};