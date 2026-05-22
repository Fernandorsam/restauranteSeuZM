// src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { JWT_SECRET } from '../config/environment.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Acesso não autorizado. Faça login para continuar.');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new ApiError(401, 'Usuário não encontrado');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Conta desativada. Entre em contato com o suporte.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Token inválido');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expirado');
    }
    throw error;
  }
});

// Autorizar por papéis
export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Você não tem permissão para realizar esta ação');
    }
    next();
  };
}

// Verificar propriedade
export function checkOwnership(model) {
  return asyncHandler(async (req, res, next) => {
    const doc = await model.findById(req.params.id);
    
    if (!doc) {
      throw new ApiError(404, 'Documento não encontrado');
    }

    if (doc.createdBy && doc.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Você não tem permissão para modificar este documento');
    }

    next();
  });
}