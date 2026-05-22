// src/validators/contactValidator.js

import joi from 'joi';

// Schema para criar um novo contato
const create = joi.object({
  name: joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Nome é obrigatório',
      'string.min': 'Nome deve ter no mínimo {#limit} caracteres',
      'string.max': 'Nome deve ter no máximo {#limit} caracteres',
      'any.required': 'Nome é obrigatório',
    }),

  email: joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'E-mail inválido',
      'string.empty': 'E-mail é obrigatório',
      'any.required': 'E-mail é obrigatório',
    }),

  phone: joi.string()
    .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Telefone deve estar no formato (XX) XXXXX-XXXX',
    }),

  subject: joi.string()
    .trim()
    .max(200)
    .optional()
    .default('Geral')
    .messages({
      'string.max': 'Assunto deve ter no máximo {#limit} caracteres',
    }),

  message: joi.string()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Mensagem é obrigatória',
      'string.min': 'Mensagem deve ter no mínimo {#limit} caracteres',
      'string.max': 'Mensagem deve ter no máximo {#limit} caracteres',
      'any.required': 'Mensagem é obrigatória',
    }),
});

const createContValidator = create
export default createContValidator