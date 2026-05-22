// src/middlewares/rateLimiter.js

import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } from '../config/environment.js';
import logger from './logger.js';

/**
 * Factory para criar limitadores de taxa com configurações personalizadas.
 */
const createLimiter = (options = {}) => {
  const defaultConfig = {
    windowMs: RATE_LIMIT_WINDOW || 15 * 60 * 1000,
    max: RATE_LIMIT_MAX || 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn('Rate limit excedido', {
        ip: req.ip,
        path: req.originalUrl,
        limit: options.max,
        windowMs: options.windowMs
      });
      
      res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente mais tarde.'
      });
    },
    skip: (req) => {
      return process.env.NODE_ENV === 'test';
    },
    // ✅ CORRIGIDO: Removido o keyGenerator customizado
    // O express-rate-limit usa req.ip automaticamente com suporte a IPv6
    ...options
  };

  return rateLimit(defaultConfig);
};

// ============================
// Limitadores Específicos
// ============================

const rateLimiter = {
  // Limitador geral para todas as rotas da API
  global: createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
  }),

  // Limitador mais restritivo para autenticação
  auth: createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: false
  }),

  // Limitador para criação de reservas
  reservation: createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 15
  }),

  // Limitador para formulário de contato
  contact: createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5
  }),

  // Limitador para API de cardápio
  menu: createLimiter({
    windowMs: 1 * 60 * 1000,
    max: 60
  }),

  // Limitador para rotas administrativas
  admin: createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200
  })
};

export default rateLimiter;