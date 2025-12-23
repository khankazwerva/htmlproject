const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  let statusCode = 500;
  let message = 'Внутренняя ошибка сервера';
  let errors = null;

  // Ошибки валидации Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Ошибка валидации';
    errors = Object.values(err.errors).map(error => error.message);
  }
  
  // Дубликат ключа (уникальное поле)
  else if (err.code === 11000) {
    statusCode = 409;
    message = 'Конфликт данных';
    const field = Object.keys(err.keyValue)[0];
    errors = [`${field} уже существует`];
  }
  
  // CastError (неверный ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Некорректный идентификатор';
  }
  
  // JWT ошибки
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Неверный токен';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Токен истек';
  }
  
  // Пользовательские ошибки
  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }

  // Отправка ответа с ошибкой
  res.status(statusCode).json({
    success: false,
    error: message,
    message: message,
    errors: errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;