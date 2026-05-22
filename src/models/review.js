// src/models/review.js

import { Schema, Types, model } from 'mongoose';

const reviewSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    default: null // null = avaliação geral do restaurante
  },
  rating: {
    type: Number,
    required: [true, 'Nota é obrigatória'],
    min: [1, 'Nota mínima é 1'],
    max: [5, 'Nota máxima é 5']
  },
  comment: {
    type: String,
    required: [true, 'Comentário é obrigatório'],
    trim: true,
    minlength: [5, 'Comentário deve ter no mínimo 5 caracteres'],
    maxlength: [2000, 'Comentário deve ter no máximo 2000 caracteres']
  },
  images: [{
    type: String, // URLs das imagens (opcional)
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL de imagem inválida'
    }
  }],
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Status inválido: {VALUE}'
    },
    default: 'pending'
  },
  response: {
    text: String,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  },
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  moderationNote: {
    type: String,
    maxlength: [500, 'Nota de moderação deve ter no máximo 500 caracteres']
  },
  moderatedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
reviewSchema.index({ item: 1, status: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

// Virtual: URL do avatar do usuário
reviewSchema.virtual('userAvatar').get(function() {
  return this.user?.avatar || null;
});

// Middleware: ao salvar uma resposta, definir a data automaticamente
reviewSchema.pre('save', function(next) {
  if (this.isModified('response.text') && this.response.text) {
    this.response.createdAt = new Date();
  }
  next();
});

// Método estático: buscar avaliações aprovadas por item
reviewSchema.statics.findApprovedByItem = function(itemId) {
  return this.find({ item: itemId, status: 'approved' })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });
};

// Método estático: calcular média de avaliações de um item
reviewSchema.statics.calculateAverageRating = async function(itemId) {
  const result = await this.aggregate([
    { $match: { item: Types.ObjectId(itemId), status: 'approved' } },
    {
      $group: {
        _id: '$item',
        averageRating: { $avg: '$rating' },
        numberOfReviews: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) {
    return { averageRating: 0, numberOfReviews: 0 };
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    numberOfReviews: result[0].numberOfReviews
  };
};

const review = model('review', reviewSchema);

export default review;