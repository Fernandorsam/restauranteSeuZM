// src/services/reservationService.js
import Reservation from "../models/reservation.js";
import emailService from "./emailService.js";
import notificationService from "./notificationService.js";
import ApiError from "../utils/ApiError.js";
import { info, error as _error } from "../middlewares/logger.js";

class ReservationService {
  maxCapacity = 60;

  reservationTimes = [
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
  ];

  async createReservation(data) {
    try {
      // Verificar disponibilidade
      if (!data?.reservationDetails) {
        throw new ApiError(400, "Detalhes da reserva são obrigatórios");
      }

      const { date, time, guests } = data.reservationDetails;
      if (!date || !time || !guests) {
        throw ApiError.badRequest(
          "Data, horário e número de convidados são obrigatórios",
        );
      }

      const reservationDate = new Date(date);
      if (Number.isNaN(reservationDate.getTime())) {
        throw ApiError.badRequest("Data da reserva inválida");
      }

      if (!/^[0-2]\d:[0-5]\d$/.test(time)) {
        throw ApiError.badRequest("Horário deve estar no formato HH:MM");
      }

      if (!Number.isInteger(guests) || guests < 1) {
        throw ApiError.badRequest("Número de convidados inválido");
      }

      const isAvailable = await this.checkAvailability(
        reservationDate,
        time,
        guests,
      );

      if (!isAvailable.available) {
        throw new ApiError(400, "Horário indisponível para esta data");
      }

      // Criar reserva

      const reservation = await Reservation.create(data);

      await emailService.sendReservationConfirmation(reservation);
      await notificationService.notifyAdminNewReservation(reservation);

      // Agendar lembrete
      await this.scheduleReminder(reservation);

      info(`Reserva criada: ${reservation._id}`);

      return reservation;
    } catch (error) {
      _error("Erro ao criar reserva:", error);
      throw error;
    }
  }

  async checkAvailability(date, time, guests) {
    // Verificar se é dia e horário de funcionamento
    if (!time || typeof time !== "string") {
      throw ApiError.badRequest("Horário é obrigatório e deve ser uma string");
    }

    if (!/^[0-2]\d:[0-5]\d$/.test(time)) {
      throw ApiError.badRequest("Horário deve estar no formato HH:MM");
    }

    const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
    const hour = parseInt(time.split(":")[0], 10);

    if ((dayOfWeek === 0 && hour < 11) || hour >= 22) {
      return { available: false, message: "Fora do horário de funcionamento" };
    }

    if ((dayOfWeek === 6 && hour < 11) || hour >= 23) {
      return { available: false, message: "Fora do horário de funcionamento" };
    }

    if (dayOfWeek >= 1 && dayOfWeek <= 5 && (hour < 11 || hour >= 22)) {
      return { available: false, message: "Fora do horário de funcionamento" };
    }

    // Verificar capacidade
    const MAX_CAPACITY = 60; // Capacidade total do restaurante
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const existingReservations = await Reservation.find({
      "reservationDetails.date": {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      "reservationDetails.time": time,
      status: { $in: ["pending", "confirmed"] },
    });

    const currentGuests = existingReservations.reduce(
      (total, res) => total + res.reservationDetails.guests,
      0,
    );

    const remainingCapacity = MAX_CAPACITY - currentGuests;

    return {
      available: remainingCapacity >= guests,
      remainingCapacity,
      totalCapacity: MAX_CAPACITY,
      currentReservations: existingReservations.length,
    };
  }

  async getAvailabilityByDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservations = await Reservation.find({
      "reservationDetails.date": {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      status: { $in: ["pending", "confirmed"] },
    });

    const reservationsByTime = existingReservations.reduce((acc, reservation) => {
      const reservationTime = reservation.reservationDetails.time;

      if (!acc[reservationTime]) {
        acc[reservationTime] = {
          guests: 0,
          reservations: 0,
        };
      }

      acc[reservationTime].guests += reservation.reservationDetails.guests;
      acc[reservationTime].reservations += 1;
      return acc;
    }, {});

    const slots = this.reservationTimes.map((time) => {
      const currentGuests = reservationsByTime[time]?.guests || 0;
      const currentReservations = reservationsByTime[time]?.reservations || 0;
      const remainingCapacity = this.maxCapacity - currentGuests;

      return {
        time,
        available: remainingCapacity > 0,
        remainingCapacity,
        totalCapacity: this.maxCapacity,
        currentReservations,
      };
    });

    return {
      date,
      slots,
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
      Reservation.countDocuments(filters),
    ]);

    return {
      reservations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getReservationById(id) {
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      throw new ApiError(404, "Reserva não encontrada");
    }

    return reservation;
  }

  async confirmReservation(id) {
    const reservation = await this.getReservationById(id);

    if (reservation.status !== "pending") {
      throw new ApiError(400, "Reserva não pode ser confirmada");
    }

    await reservation.confirm();
    await emailService.sendConfirmationEmail(reservation);

    return reservation;
  }

  async cancelReservation(id, reason) {
    const reservation = await this.getReservationById(id);

    if (["cancelled", "completed"].includes(reservation.status)) {
      throw new ApiError(400, "Reserva não pode ser cancelada");
    }

    await reservation.cancel(reason);
    await emailService.sendCancellationEmail(reservation);
    await notificationService.notifyAdminCancellation(reservation);

    return reservation;
  }

  async scheduleReminder(reservation) {
    const reservationDate = new Date(reservation.reservationDetails.date);
    const reminderDate = new Date(
      reservationDate.getTime() - 24 * 60 * 60 * 1000,
    ); // 24 horas antes

    // Aqui você implementaria a lógica de agendamento
    // Pode usar node-cron, bull queue, etc.

    info(
      `Lembrete agendado para reserva ${reservation._id} em ${reminderDate}`,
    );
  }
}

const reservationService = new ReservationService();

export default reservationService;
