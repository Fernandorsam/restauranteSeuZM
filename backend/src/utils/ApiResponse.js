// src/utils/ApiResponse.js
class ApiResponse {
  static success(res, message, data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...(data && { data }),
      timestamp: new Date().toISOString()
    });
  }

  static created(res, message, data = null) {
    return this.success(res, message, data, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }

  static error(res, message, statusCode = 400, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString()
    });
  }

  static notFound(res, message = 'Recurso não encontrado') {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = 'Não autorizado') {
    return this.error(res, message, 401);
  }

  static paginated(res, message, { data, pagination }) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    });
  }
}

export default ApiResponse;