// src/middlewares/logger.js
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { NODE_ENV } from '../config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar diretório de logs se não existir
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formatação personalizada
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;
    if (metadata?.method) log += ` ${metadata.method} ${metadata.url}`;
    log += `: ${message}`;
    if (stack) log += `\n${stack}`;
    if (metadata && Object.keys(metadata).length > 0) {
      const meta = { ...metadata };
      delete meta.method;
      delete meta.url;
      if (Object.keys(meta).length > 0) log += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Configuração dos transports
const transports = [];

if (NODE_ENV !== 'production') {
  transports.push(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), customFormat),
    level: 'debug'
  }));
} else {
  transports.push(new winston.transports.Console({
    format: customFormat,
    level: 'info'
  }));
}

transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: customFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10,
    level: 'info'
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    format: customFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 5,
    level: 'error'
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'http.log'),
    format: customFormat,
    maxsize: 5 * 1024 * 1024,
    maxFiles: 3,
    level: 'http'
  })
);

// Criar logger base
const logger = winston.createLogger({
  level: NODE_ENV === 'development' ? 'debug' : 'info',
  levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4 },
  format: customFormat,
  transports,
  exitOnError: false,
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log'), maxsize: 10 * 1024 * 1024, maxFiles: 3 })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log'), maxsize: 10 * 1024 * 1024, maxFiles: 3 })
  ]
});

// Métodos customizados
logger.httpRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
    body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined
  };
  const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`;
  if (res.statusCode >= 500) logger.error(message, logData);
  else if (res.statusCode >= 400) logger.warn(message, logData);
  else logger.http(message, logData);
};

logger.dbQuery = (query, executionTime, collection) => {
  logger.debug('Database Query', {
    collection,
    query: typeof query === 'object' ? JSON.stringify(query) : query,
    executionTime: `${executionTime}ms`,
    timestamp: new Date().toISOString()
  });
};

logger.performance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger.log(level, `Performance: ${operation}`, { operation, duration: `${duration}ms`, ...metadata });
};

logger.business = (event, data) => {
  logger.info(`Business Event: ${event}`, { event, data, timestamp: new Date().toISOString() });
};

logger.audit = (action, userId, details) => {
  logger.info(`Audit: ${action}`, { action, userId, details, timestamp: new Date().toISOString(), ip: details.ip || 'unknown' });
  const auditLog = { timestamp: new Date().toISOString(), action, userId, ...details };
  fs.appendFile(path.join(logDir, 'audit.log'), JSON.stringify(auditLog) + '\n', (err) => {
    if (err) logger.error('Erro ao escrever log de auditoria:', err);
  });
};

// Stream para Morgan
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// Sanitização de dados sensíveis
function sanitizeBody(body) {
  if (!body) return undefined;
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'cvv'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
  });
  return sanitized;
}

// Exportações nomeadas (para quem importa funções individuais)
export const info = logger.info.bind(logger);
export const error = logger.error.bind(logger);
export const warn = logger.warn.bind(logger);
export const debug = logger.debug.bind(logger);
export const http = logger.http.bind(logger);
export const business = logger.business.bind(logger);
export const audit = logger.audit.bind(logger);
export const performance = logger.performance.bind(logger);
export const dbQuery = logger.dbQuery.bind(logger);
export const httpRequest = logger.httpRequest.bind(logger);

// Exportação default (para quem usa import logger from '...')
export default logger;