// src/validators/menuValidator.js

import joi from 'joi';

// Helper para validar preço promocional em relação ao preço normal
// (usado no schema customizado, mas o Joi não tem validação condicional simples;
//  faremos uma validação adicional no controller se necessário, ou podemos usar Joi.custom)
// Aqui vamos apenas definir os campos individualmente.

// Schema para informações nutricionais
const nutritionalInfoSchema = joi.object({
  calories: joi.number().min(0).optional(),
  protein: joi.number().min(0).optional(),
  carbs: joi.number().min(0).optional(),
  fat: joi.number().min(0).optional(),
  fiber: joi.number().min(0).optional()
}).optional();

// Schema para imagens
const imageSchema = joi.object({
  url: joi.string().uri().required(),
  alt: joi.string().max(200).optional().default(''),
  isMain: joi.boolean().optional().default(false)
});

// Schema para ingredientes
const ingredientSchema = joi.object({
  name: joi.string().trim().max(100).required(),
  isAllergen: joi.boolean().optional().default(false)
});

// Schema para criação de item
const createItem = joi.object({
  name: joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Nome do item é obrigatório',
      'string.min': 'Nome deve ter no mínimo {#limit} caracteres',
      'string.max': 'Nome deve ter no máximo {#limit} caracteres',
      'any.required': 'Nome do item é obrigatório'
    }),

  category: joi.string()
    .required()
    .messages({
      'string.empty': 'Categoria é obrigatória',
      'any.required': 'Categoria é obrigatória'
    }),

  description: joi.string()
    .max(500)
    .required()
    .messages({
      'string.empty': 'Descrição é obrigatória',
      'string.max': 'Descrição deve ter no máximo {#limit} caracteres',
      'any.required': 'Descrição é obrigatória'
    }),

  shortDescription: joi.string()
    .max(150)
    .optional()
    .allow(''),

  price: joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Preço deve ser um número',
      'number.min': 'Preço não pode ser negativo',
      'any.required': 'Preço é obrigatório'
    }),

  promotionalPrice: joi.number()
    .min(0)
    .optional()
    .allow(null)
    .messages({
      'number.min': 'Preço promocional não pode ser negativo'
    }),

  images: joi.array()
    .items(imageSchema)
    .max(10)
    .optional(),

  ingredients: joi.array()
    .items(ingredientSchema)
    .optional(),

  nutritionalInfo: nutritionalInfoSchema,

  isAvailable: joi.boolean()
    .optional()
    .default(true),

  isPopular: joi.boolean()
    .optional()
    .default(false),

  isVegetarian: joi.boolean()
    .optional()
    .default(false),

  isGlutenFree: joi.boolean()
    .optional()
    .default(false),

  preparationTime: joi.number()
    .integer()
    .min(0)
    .optional(),

  servingSize: joi.string()
    .max(50)
    .optional(),

  tags: joi.array()
    .items(joi.string().trim().max(50))
    .max(20)
    .optional()
});

// Schema para atualização de item (todos os campos opcionais)
const updateItem = createItem.fork(
  ['name', 'category', 'description', 'price'],
  (field) => field.optional()
);

// Schema para criação de categoria
const createCategory = joi.object({
  name: joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Nome da categoria é obrigatório',
      'string.min': 'Nome deve ter no mínimo {#limit} caracteres',
      'string.max': 'Nome deve ter no máximo {#limit} caracteres',
      'any.required': 'Nome da categoria é obrigatório'
    }),

  description: joi.string()
    .max(500)
    .optional()
    .allow(''),

  image: joi.string()
    .uri()
    .optional()
    .allow(''),

  isActive: joi.boolean()
    .optional()
    .default(true)
});

// Schema para atualização de categoria
const updateCategory = createCategory.fork(
  ['name'],
  (field) => field.optional()
);

export  {
  createItem,
  updateItem,
  createCategory,
  updateCategory
};