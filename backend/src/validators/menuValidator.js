// src/validators/menuValidator.js

import { object, number, string, boolean, array } from 'joi';

// Helper para validar preço promocional em relação ao preço normal
// (usado no schema customizado, mas o Joi não tem validação condicional simples;
//  faremos uma validação adicional no controller se necessário, ou podemos usar Joi.custom)
// Aqui vamos apenas definir os campos individualmente.

// Schema para informações nutricionais
const nutritionalInfoSchema = object({
  calories: number().min(0).optional(),
  protein: number().min(0).optional(),
  carbs: number().min(0).optional(),
  fat: number().min(0).optional(),
  fiber: number().min(0).optional()
}).optional();

// Schema para imagens
const imageSchema = object({
  url: string().uri().required(),
  alt: string().max(200).optional().default(''),
  isMain: boolean().optional().default(false)
});

// Schema para ingredientes
const ingredientSchema = object({
  name: string().trim().max(100).required(),
  isAllergen: boolean().optional().default(false)
});

// Schema para criação de item
const createItem = object({
  name: string()
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

  category: string()
    .required()
    .messages({
      'string.empty': 'Categoria é obrigatória',
      'any.required': 'Categoria é obrigatória'
    }),

  description: string()
    .max(500)
    .required()
    .messages({
      'string.empty': 'Descrição é obrigatória',
      'string.max': 'Descrição deve ter no máximo {#limit} caracteres',
      'any.required': 'Descrição é obrigatória'
    }),

  shortDescription: string()
    .max(150)
    .optional()
    .allow(''),

  price: number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Preço deve ser um número',
      'number.min': 'Preço não pode ser negativo',
      'any.required': 'Preço é obrigatório'
    }),

  promotionalPrice: number()
    .min(0)
    .optional()
    .allow(null)
    .messages({
      'number.min': 'Preço promocional não pode ser negativo'
    }),

  images: array()
    .items(imageSchema)
    .max(10)
    .optional(),

  ingredients: array()
    .items(ingredientSchema)
    .optional(),

  nutritionalInfo: nutritionalInfoSchema,

  isAvailable: boolean()
    .optional()
    .default(true),

  isPopular: boolean()
    .optional()
    .default(false),

  isVegetarian: boolean()
    .optional()
    .default(false),

  isGlutenFree: boolean()
    .optional()
    .default(false),

  preparationTime: number()
    .integer()
    .min(0)
    .optional(),

  servingSize: string()
    .max(50)
    .optional(),

  tags: array()
    .items(string().trim().max(50))
    .max(20)
    .optional()
});

// Schema para atualização de item (todos os campos opcionais)
const updateItem = createItem.fork(
  ['name', 'category', 'description', 'price'],
  (field) => field.optional()
);

// Schema para criação de categoria
const createCategory = object({
  name: string()
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

  description: string()
    .max(500)
    .optional()
    .allow(''),

  image: string()
    .uri()
    .optional()
    .allow(''),

  isActive: boolean()
    .optional()
    .default(true)
});

// Schema para atualização de categoria
const updateCategory = createCategory.fork(
  ['name'],
  (field) => field.optional()
);

export default {
  createItem,
  updateItem,
  createCategory,
  updateCategory
};