// src/controllers/reservationController.js
import reservationService from '../services/reservationService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

class ReservationController {
  /**
   * @swagger
   * /api/reservations:
   *   post:
   *     tags: [Reservas]
   *     summary: Criar nova reserva
   */
  create = asyncHandler(async (req, res) => {
    const reservation = await reservationService.createReservation(req.body);
    
    return ApiResponse.created(res, 'Reserva criada com sucesso', {
      reservation,
      message: 'Verifique seu email para confirmar a reserva'
    });
  });

  /**
   * @swagger
   * /api/reservations:
   *   get:
   *     tags: [Reservas]
   *     summary: Listar todas as reservas
   */
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, status, startDate, endDate } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (startDate && endDate) {
      filters['reservationDetails.date'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const result = await reservationService.getReservations(filters, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { 'reservationDetails.date': 1 }
    });
    
    return ApiResponse.success(res, 'Reservas listadas com sucesso', result);
  });

  /**
   * @swagger
   * /api/reservations/{id}:
   *   get:
   *     tags: [Reservas]
   *     summary: Obter reserva por ID
   */
  getById = asyncHandler(async (req, res) => {
    const reservation = await reservationService.getReservationById(req.params.id);
    
    if (!reservation) {
      return ApiResponse.notFound(res, 'Reserva não encontrada');
    }
    
    return ApiResponse.success(res, 'Reserva encontrada', { reservation });
  });

  /**
   * @swagger
   * /api/reservations/{id}/confirm:
   *   patch:
   *     tags: [Reservas]
   *     summary: Confirmar reserva
   */
  confirm = asyncHandler(async (req, res) => {
    const reservation = await reservationService.confirmReservation(req.params.id);
    
    return ApiResponse.success(res, 'Reserva confirmada com sucesso', { reservation });
  });

  /**
   * @swagger
   * /api/reservations/{id}/cancel:
   *   patch:
   *     tags: [Reservas]
   *     summary: Cancelar reserva
   */
  cancel = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const reservation = await reservationService.cancelReservation(
      req.params.id, 
      reason
    );
    
    return ApiResponse.success(res, 'Reserva cancelada com sucesso', { reservation });
  });

  /**
   * @swagger
   * /api/reservations/availability:
   *   get:
   *     tags: [Reservas]
   *     summary: Verificar disponibilidade
   */
  checkAvailability = asyncHandler(async (req, res) => {
    const { date, time, guests } = req.query;

    const availability = time && guests
      ? await reservationService.checkAvailability(
        new Date(date),
        time,
        parseInt(guests, 10)
      )
      : await reservationService.getAvailabilityByDate(new Date(date));
    
    return ApiResponse.success(res, 'Disponibilidade verificada', availability);
  });
}

const reservationController = new ReservationController();
export default reservationController;
