import cors from 'cors';
import { FRONTEND_URL, NODE_ENV } from './environment.js';

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (como Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 horas
};

export default cors(corsOptions);