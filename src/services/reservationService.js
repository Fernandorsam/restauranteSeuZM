// src/services/reservationService.js
import Reservation from '../models/Reservation.js';
import  emailService  from './emailService.js';
import notificationService from './notificationService.js';
import ApiError from '../utils/ApiError.js';
import { info, error as _error } from '../middlewares/logger.js';

class ReservationService {
  async createReservation(data) {
    try {
      // Verificar disponibilidade
      const isAvailable = await this.checkAvailability(
        new Date(data.date),
        data.time,
        data.guests
      );
      
      if (!isAvailable.available) {
        throw new ApiError(400, 'Horário indisponível para esta data');
      }

      // Criar reserva
     
      const reservation = await Reservation.create(data);
      
      // Enviar email de confirmação
      await notificationService.send('email', {
        to: reservation.customer.email,
        subject: 'Confirmação de Reserva',
        html: emailService.reservationConfirmation(reservation)
      });
      
      // Notificar administrador
      await notificationService.send('email', {
        to: 'admin@seuzemane.com',
        subject: 'Nova Reserva Criada',
        html: `
          <p>Uma nova reserva foi criada para ${reservation.reservationDetails.date} às ${reservation.reservationDetails.time}.</p>
          <p>Cliente: ${reservation.customer.name} (${reservation.customer.email})</p>
        `
      });
      
      // Agendar lembrete
      await this.scheduleReminder(reservation);
      
      info(`Reserva criada: ${reservation._id}`);
      
      return reservation;
    } catch (error) {
      _error('Erro ao criar reserva:', error);
      throw error;
    }
  }

  async checkAvailability(date, time, guests) {
    // Verificar se é dia e horário de funcionamento
    const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
    const hour = parseInt(time.split(':')[0]);
    
    if (dayOfWeek === 0 && hour < 11 || hour >= 22) {
      return { available: false, message: 'Fora do horário de funcionamento' };
    }
    
    if (dayOfWeek === 6 && hour < 11 || hour >= 23) {
      return { available: false, message: 'Fora do horário de funcionamento' };
    }
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && (hour < 11 || hour >= 22)) {
      return { available: false, message: 'Fora do horário de funcionamento' };
    }

    // Verificar capacidade
    const MAX_CAPACITY = 60; // Capacidade total do restaurante
    const existingReservations = await Reservation.find({
      'reservationDetails.date': {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      },
      'reservationDetails.time': time,
      status: { $in: ['pending', 'confirmed'] }
    });

    const currentGuests = existingReservations.reduce(
      (total, res) => total + res.reservationDetails.guests, 
      0
    );

    const remainingCapacity = MAX_CAPACITY - currentGuests;

    return {
      available: remainingCapacity >= guests,
      remainingCapacity,
      totalCapacity: MAX_CAPACITY,
      currentReservations: existingReservations.length
    };
  }

  async getReservations(filters, options) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    
    const query = Reservation.find(filters)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const [reservations, total] = await Promise.all([
      query.exec(),
      Reservation.countDocuments(filters)
    ]);

    return {
      reservations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async getReservationById(id) {
    const reservation = await Reservation.findById(id);
    
    if (!reservation) {
      throw new ApiError(404, 'Reserva não encontrada');
    }
    
    return reservation;
  }

  async confirmReservation(id) {
    const reservation = await this.getReservationById(id);
    
    if (reservation.status !== 'pending') {
      throw new ApiError(400, 'Reserva não pode ser confirmada');
    }
    
    await reservation.confirm();
    await notificationService.send('email', {
      to: reservation.customer.email,
      subject: 'Confirmação de Reserva',
      html: emailService.reservationConfirmation(reservation)
    });
    
    return reservation;
  }

  async cancelReservation(id, reason) {
    const reservation = await this.getReservationById(id);
    
    if (['cancelled', 'completed'].includes(reservation.status)) {
      throw new ApiError(400, 'Reserva não pode ser cancelada');
    }
    
    await reservation.cancel(reason);
    await notificationService.send('email', {
      to: reservation.customer.email,
      subject: 'Cancelamento de Reserva',
      html: emailService.reservationCancellation(reservation, reason)
    });
    
    return reservation;
  }

  async scheduleReminder(reservation) {
    const reservationDate = new Date(reservation.reservationDetails.date);
    const reminderDate = new Date(reservationDate.getTime() - 24 * 60 * 60 * 1000); // 24 horas antes
    
    // Aqui você implementaria a lógica de agendamento
    // Pode usar node-cron, bull queue, etc.
    
    info(`Lembrete agendado para reserva ${reservation._id} em ${reminderDate}`);
  }
}


const reservationService = new ReservationService();

export default reservationService;