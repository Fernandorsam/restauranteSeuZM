// src/app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoSanitize from './middlewares/mongoSanitize.js'; 
import xssSanitize from './middlewares/xssSanitize.js';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import cors from './config/cors.js';
import router from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';
import logger from './middlewares/logger.js';
import { requestLogger, errorLogger }  from './middlewares/loggerMiddleware.js';
import morganMiddleware from './config/morgan.js';


import swagger from './config/swagger.js';
import { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX, NODE_ENV } from './config/environment.js';

const app = express();

// Usar Morgan com Winston
app.use(morganMiddleware);

// Usar logger middleware personalizado
app.use(requestLogger);

// Security HTTP headers
app.use(helmet());

// CORS
app.use(cors);

// Rate limiting global
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  message: 'Muitas requisições deste IP, tente novamente mais tarde'
});
app.use('/api', limiter);

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize);

// Data sanitization against XSS
app.use(xssSanitize);

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['price', 'rating', 'category']
}));

// Compression
app.use(compression());

// Static files
app.use('/uploads',express.static('uploads'));

// Swagger documentation
swagger(app);

// API Routes
app.use('/api', router);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Error logger
app.use(errorLogger);

// Global error handler
app.use(errorHandler);

export default app;