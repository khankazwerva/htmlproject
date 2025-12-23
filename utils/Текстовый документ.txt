module.exports = {
  CATEGORIES: ['electronics', 'clothing', 'books', 'food', 'other'],
  
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },
  
  PAYMENT_METHODS: ['cash', 'card', 'online'],
  
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },
  
  ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  },
  
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Не авторизован',
    FORBIDDEN: 'Доступ запрещен',
    NOT_FOUND: 'Ресурс не найден',
    SERVER_ERROR: 'Внутренняя ошибка сервера',
    VALIDATION_ERROR: 'Ошибка валидации'
  }
};