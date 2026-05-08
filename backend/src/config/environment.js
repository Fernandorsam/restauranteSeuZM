// src/config/environment.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Necessário para obter __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Exporta cada valor individualmente
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 5000;

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seu_ze_seu_mane';

export const JWT_SECRET = process.env.JWT_SECRET || 'seu-jwt-secret-key';
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

export const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
export const EMAIL_PORT = process.env.EMAIL_PORT || 587;
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@seuzeeseumane.com.br';
export const MANAGER_EMAILS = process.env.MANAGER_EMAILS?.split(',') || ['manager@seuzeeseumane.com.br'];

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const UPLOAD_PATH = path.join(__dirname, '../../uploads');

export const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
export const RATE_LIMIT_MAX = 100;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;