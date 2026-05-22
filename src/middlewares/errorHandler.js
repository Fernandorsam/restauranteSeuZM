// src/middlewares/errorHandler.js
import ApiError from '../utils/ApiError.js';
import { error as _error } from './logger.js';
import { NODE_ENV } from '../config/environment.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  _error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Recurso não encontrado';
    error = new ApiError(404, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Valor duplicado para o campo: ${field}`;
    error = new ApiError(400, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Token inválido');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expirado');
  }

  // Resposta
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erro interno do servidor',
    ...(error.errors && { errors: error.errors }),
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;