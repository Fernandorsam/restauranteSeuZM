// src/middlewares/rateLimiter.js

import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX, NODE_ENV } from '../config/environment.js';
import ApiError from '../utils/ApiError.js';
import { warn } from './logger.js';

/**
 * Factory para criar limitadores de taxa com configurações personalizadas.
 * @param {object} options - Opções do express-rate-limit (override).
 * @returns {function} Middleware de rate limiting.
 */
const createLimiter = (options = {}) => {
  const defaultConfig = {
    windowMs: RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutos
    max: RATE_LIMIT_MAX || 100,                     // máximo de requisições por janela
    standardHeaders: true,                                      // Retorna RateLimit-* headers
    legacyHeaders: false,                                       // Desabilita X-RateLimit-* headers
    handler: (req, res, next, options) => {
      warn('Rate limit excedido', {
        ip: req.ip,
        path: req.originalUrl,
        limit: options.max,
        windowMs: options.windowMs
      });

      // Resposta padronizada usando ApiError
      throw new ApiError(429, 'Muitas requisições. Tente novamente mais tarde.');
    },
    skip: (req) => {
      // Opcional: pular rate limiting para IPs confiáveis ou ambiente de testes
      return NODE_ENV === 'test';
    },
    keyGenerator: (req) => {
      // Usar IP real, considerando proxies confiáveis
      return req.ip;
    },
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
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,                 // 100 requisições por IP
    message: 'Muitas requisições. Aguarde 15 minutos.'
  }),

  // Limitador mais restritivo para autenticação (login, registro)
  auth: createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,                  // apenas 10 tentativas
    message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
    skipSuccessfulRequests: false
  }),

  // Limitador para criação de reservas
  reservation: createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 15,                  // 15 reservas por hora por IP
    message: 'Limite de reservas excedido. Tente novamente mais tarde.'
  }),

  // Limitador para formulário de contato
  contact: createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5,                   // 5 mensagens por hora
    message: 'Limite de envio de mensagens atingido. Aguarde uma hora.'
  }),

  // Limitador para API de cardápio (pode ser mais generoso)
  menu: createLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60,                 // 60 requisições por minuto
    message: 'Muitas requisições ao cardápio.'
  }),

  // Limitador para rotas administrativas (geralmente mais permissivo, pois são poucos admins)
  admin: createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200,
    skip: (req) => {
      // Pode pular rate limit para IPs internos
      const internalIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
      return internalIPs.includes(req.ip);
    }
  })
};

export default rateLimiter;