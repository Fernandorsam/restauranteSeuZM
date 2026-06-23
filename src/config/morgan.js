
import morgan from 'morgan';
import { http } from '../middlewares/logger.js';

// Formato personalizado para Morgan
const morganFormat = ':method :url :status :response-time ms - :res[content-length]';

// Criar stream que usa o logger Winston
const stream = {
  write: (message) => {
    const parts = message.trim().split(' ');
    http('HTTP Request', {
      method: parts[0],
      url: parts[1],
      status: parts[2],
      responseTime: parts[3],
      size: parts[5] || '0'
    });
  }
};

// Middleware Morgan configurado
const morganMiddleware = morgan(morganFormat, { stream });

export default morganMiddleware;