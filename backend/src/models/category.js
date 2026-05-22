// src/models/Category.js

import { Schema, model } from 'mongoose';

const categorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Nome da categoria é obrigatório'],
    unique: true,
    trim: true,
    maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Descrição deve ter no máximo 500 caracteres'],
    default: ''
  },
  image: {
    type: String, // URL da imagem representativa da categoria
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

// Middleware para gerar slug automaticamente ao salvar
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')      // Remove caracteres especiais
      .replace(/[\s_-]+/g, '-')      // Substitui espaços e underscores por hífen
      .replace(/^-+|-+$/g, '');      // Remove hífens no início e fim
  }
  next();
});

// Virtual: quantidade de itens ativos nesta categoria
categorySchema.virtual('itemCount', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'category',
  count: true,
  match: { isAvailable: true }
});

// Método estático: buscar categorias ativas
categorySchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

export default model('Category', categorySchema);