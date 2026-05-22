// src/validators/reviewValidator.js

import joi from 'joi';

// Schema para criação de avaliação
const create = joi.object({
  item: joi.string()
    .optional()
    .allow(null, '')
    .messages({
      'string.base': 'ID do item deve ser uma string'
    }),

  rating: joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'Nota deve ser um número',
      'number.integer': 'Nota deve ser um número inteiro',
      'number.min': 'Nota mínima é 1',
      'number.max': 'Nota máxima é 5',
      'any.required': 'Nota é obrigatória'
    }),

  comment: joi.string()
    .trim()
    .min(5)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Comentário é obrigatório',
      'string.min': 'Comentário deve ter no mínimo {#limit} caracteres',
      'string.max': 'Comentário deve ter no máximo {#limit} caracteres',
      'any.required': 'Comentário é obrigatório'
    }),

  images: joi.array()
    .items(joi.string().uri())
    .max(5)
    .optional()
    .messages({
      'string.uri': 'URL da imagem inválida',
      'array.max': 'Máximo de {#limit} imagens por avaliação'
    })
});

// Schema para atualização de avaliação (todos os campos opcionais)
const update = joi.object({
  rating: joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.base': 'Nota deve ser um número',
      'number.integer': 'Nota deve ser um número inteiro',
      'number.min': 'Nota mínima é 1',
      'number.max': 'Nota máxima é 5'
    }),

  comment: joi.string()
    .trim()
    .min(5)
    .max(2000)
    .optional()
    .messages({
      'string.min': 'Comentário deve ter no mínimo {#limit} caracteres',
      'string.max': 'Comentário deve ter no máximo {#limit} caracteres'
    }),

  images: joi.array()
    .items(joi.string().uri())
    .max(5)
    .optional()
    .messages({
      'string.uri': 'URL da imagem inválida',
      'array.max': 'Máximo de {#limit} imagens por avaliação'
    })
}).min(1).messages({
  'object.min': 'Pelo menos um campo deve ser atualizado'
});

// Schema para responder a uma avaliação
const respond = joi.object({
  response: joi.string()
    .trim()
    .min(5)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Resposta é obrigatória',
      'string.min': 'Resposta deve ter no mínimo {#limit} caracteres',
      'string.max': 'Resposta deve ter no máximo {#limit} caracteres',
      'any.required': 'Resposta é obrigatória'
    })
});

// Schema para moderação (aprovar/rejeitar)
const moderate = joi.object({
  status: joi.string()
    .valid('approved', 'rejected')
    .required()
    .messages({
      'any.only': 'Status deve ser "approved" ou "rejected"',
      'any.required': 'Status é obrigatório'
    }),

  moderationNote: joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Nota de moderação deve ter no máximo {#limit} caracteres'
    })
});

export  {
  create,
  update,
  respond,
  moderate
};