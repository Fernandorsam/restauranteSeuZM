// src/utils/ApiError.js
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Não autorizado') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Acesso proibido') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Recurso não encontrado') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflito de dados') {
    return new ApiError(409, message);
  }

  static tooMany(message = 'Muitas requisições') {
    return new ApiError(429, message);
  }

  static internal(message = 'Erro interno do servidor') {
    return new ApiError(500, message);
  }
}

export default ApiError;