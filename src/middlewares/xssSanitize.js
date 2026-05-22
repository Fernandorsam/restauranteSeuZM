// src/middlewares/xssSanitize.js

/**
 * Middleware para sanitizar dados contra ataques XSS
 * Remove scripts e tags HTML perigosas das entradas do usuário
 */

// Função simples para remover tags HTML e scripts
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove tags script e seu conteúdo
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove tags HTML
  str = str.replace(/<[^>]*>/g, '');
  
  // Remove eventos inline (onclick, onload, etc.)
  str = str.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
  str = str.replace(/on\w+\s*=\s*'[^']*'/gi, '');
  
  // Remove javascript: URLs
  str = str.replace(/javascript\s*:/gi, '');
  
  // Remove expressões que podem conter código malicioso
  str = str.replace(/&#/g, '');
  str = str.replace(/&#x/g, '');
  
  return str.trim();
};

// Sanitiza recursivamente um objeto
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    Object.keys(obj).forEach((key) => {
      sanitized[key] = sanitizeObject(obj[key]);
    });
    return sanitized;
  }
  
  return obj;
};

const xssSanitize = (req, res, next) => {
  try {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitizar query (apenas leitura, então sanitizamos os valores)
    if (req.query && typeof req.query === 'object') {
      Object.keys(req.query).forEach((key) => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeString(req.query[key]);
        }
      });
    }
    
    // Sanitizar params
    if (req.params && typeof req.params === 'object') {
      Object.keys(req.params).forEach((key) => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = sanitizeString(req.params[key]);
        }
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export default xssSanitize;