// src/models/Reservation.js
import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  customer: {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor, insira um email válido']
    },
    phone: {
      type: String,
      required: [true, 'Telefone é obrigatório'],
      match: [/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido']
    }
  },
  
  reservationDetails: {
    date: {
      type: Date,
      required: [true, 'Data é obrigatória'],
      validate: {
        validator: function(date) {
          return date > new Date();
        },
        message: 'Data deve ser futura'
      }
    },
    time: {
      type: String,
      required: [true, 'Horário é obrigatório'],
      enum: {
        values: [
          '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
          '14:00', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
        ],
        message: 'Horário inválido'
      }
    },
    guests: {
      type: Number,
      required: [true, 'Número de convidados é obrigatório'],
      min: [1, 'Mínimo de 1 convidado'],
      max: [20, 'Máximo de 20 convidados por reserva']
    },
    tableNumber: {
      type: Number,
      min: 1,
      max: 20
    }
  },
  
  occasion: {
    type: String,
    enum: ['aniversario', 'namoro', 'familia', 'negocios', 'outro', ''],
    default: ''
  },
  
  specialRequests: {
    type: String,
    maxlength: [500, 'Observações devem ter no máximo 500 caracteres'],
    trim: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  
  confirmationToken: String,
  confirmedAt: Date,
  cancelledAt: Date,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
reservationSchema.index({ 'reservationDetails.date': 1, 'reservationDetails.time': 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ createdAt: -1 });

// Virtuals
reservationSchema.virtual('isUpcoming').get(function() {
  return this.reservationDetails.date > new Date() && this.status !== 'cancelled';
});

// Middleware pré-salvamento
reservationSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'confirmed') {
    this.confirmedAt = new Date();
  }
  if (this.isModified('status') && this.status === 'cancelled') {
    this.cancelledAt = new Date();
  }
  next();
});

// Métodos estáticos
reservationSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    'reservationDetails.date': {
      $gte: startDate,
      $lte: endDate
    },
    status: { $ne: 'cancelled' }
  }).sort({ 'reservationDetails.date': 1, 'reservationDetails.time': 1 });
};

reservationSchema.statics.findUpcoming = function() {
  return this.find({
    'reservationDetails.date': { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  }).sort({ 'reservationDetails.date': 1 });
};

// Métodos de instância
reservationSchema.methods.cancel = async function(reason) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  return this.save();
};

reservationSchema.methods.confirm = async function() {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  return this.save();
};

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;