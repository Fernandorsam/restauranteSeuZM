// src/middlewares/mongoSanitize.js

/**
 * Middleware para sanitizar dados contra injeção NoSQL no MongoDB
 * Remove chaves que começam com $ ou contêm . dos objetos de entrada
 */

const sanitize = (obj) => {
  if (obj === null || obj === undefined) return;
  
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          sanitize(item);
        }
      });
    } else {
      Object.keys(obj).forEach((key) => {
        // Remove campos que começam com $ ou contêm .
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      });
    }
  }
};

const mongoSanitize = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  
  // Para query, criamos uma cópia sanitizada
  if (req.query) {
    const sanitizedQuery = { ...req.query };
    sanitize(sanitizedQuery);
    // Reatribui os valores sanitizados
    Object.keys(req.query).forEach((key) => {
      if (!sanitizedQuery[key]) {
        delete req.query[key];
      }
    });
  }
  
  next();
};

export default mongoSanitize;