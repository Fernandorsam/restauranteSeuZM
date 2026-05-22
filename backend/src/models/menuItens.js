// src/models/MenuItem.js
import { Schema, model } from 'mongoose';

const menuItemSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Nome do item é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Categoria é obrigatória']
  },
  
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    maxlength: [500, 'Descrição deve ter no máximo 500 caracteres']
  },
  
  shortDescription: {
    type: String,
    maxlength: [150, 'Descrição curta deve ter no máximo 150 caracteres']
  },
  
  price: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: [0, 'Preço não pode ser negativo']
  },
  
  promotionalPrice: {
    type: Number,
    min: [0, 'Preço promocional não pode ser negativo'],
    validate: {
      validator: function(value) {
        return !value || value < this.price;
      },
      message: 'Preço promocional deve ser menor que o preço original'
    }
  },
  
  images: [{
    url: String,
    alt: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  
  ingredients: [{
    name: String,
    isAllergen: {
      type: Boolean,
      default: false
    }
  }],
  
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  isPopular: {
    type: Boolean,
    default: false
  },
  
  isVegetarian: {
    type: Boolean,
    default: false
  },
  
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  
  preparationTime: {
    type: Number,
    min: 0
  },
  
  servingSize: String,
  
  tags: [{
    type: String,
    trim: true
  }],
  
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  numberOfReviews: {
    type: Number,
    default: 0
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });
menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ isPopular: -1, averageRating: -1 });

// Virtual para desconto
menuItemSchema.virtual('discount').get(function() {
  if (this.promotionalPrice) {
    return Math.round(((this.price - this.promotionalPrice) / this.price) * 100);
  }
  return 0;
});

// Middleware pré-salvamento para gerar slug
menuItemSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

// Métodos
menuItemSchema.statics.findPopular = function(limit = 8) {
  return this.find({ 
    isAvailable: true,
    isPopular: true 
  })
  .populate('category', 'name')
  .sort({ averageRating: -1 })
  .limit(limit);
};

menuItemSchema.statics.findByCategory = function(categoryId) {
  return this.find({ 
    category: categoryId,
    isAvailable: true 
  }).populate('category', 'name');
};

const MenuItem = model('MenuItem', menuItemSchema);

export default MenuItem;