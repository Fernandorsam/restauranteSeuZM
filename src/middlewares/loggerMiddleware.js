// src/middlewares/loggerMiddleware.js
import { debug, httpRequest, performance, error as _error, dbQuery } from './logger.js';

// Middleware de logging para requisições HTTP
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log da requisição recebida
  debug(`Incoming ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Capturar o fim da resposta
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;

    // Log da resposta
    httpRequest(req, res, responseTime);

    // Log de performance para requisições lentas
    if (responseTime > 1000) {
      performance('Slow Request', responseTime, {
        url: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Middleware para logging de erros
const errorLogger = (err, req, res, next) => {
  _error('Unhandled Error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
      userId: req.user?.id
    }
  });

  next(err);
};

// Middleware para logging de queries MongoDB (usar com mongoose)
const mongooseQueryLogger = (schema) => {
  schema.pre(/^find/, function() {
    this._startTime = Date.now();
  });

  schema.post(/^find/, function() {
    if (this._startTime) {
      const executionTime = Date.now() - this._startTime;
      dbQuery(
        this.getQuery(),
        executionTime,
        this.model.collection.collectionName
      );
    }
  });
};

export {
  requestLogger,
  errorLogger,
  mongooseQueryLogger
};