// src/validators/reservationValidator.js
import Joi from 'joi';

const create = Joi.object({
  customer: Joi.object({
    name: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'Nome deve ter no mínimo {#limit} caracteres',
        'string.max': 'Nome deve ter no máximo {#limit} caracteres',
        'any.required': 'Nome é obrigatório'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email inválido',
        'any.required': 'Email é obrigatório'
      }),
    
    phone: Joi.string()
      .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .required()
      .messages({
        'string.pattern.base': 'Telefone deve estar no formato (XX) XXXXX-XXXX',
        'any.required': 'Telefone é obrigatório'
      })
  }).required(),

  reservationDetails: Joi.object({
    date: Joi.date()
      .greater('now')
      .required()
      .messages({
        'date.greater': 'Data deve ser futura',
        'any.required': 'Data é obrigatória'
      }),
    
    time: Joi.string()
      .valid(
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
      )
      .required()
      .messages({
        'any.only': 'Horário inválido',
        'any.required': 'Horário é obrigatório'
      }),
    
    guests: Joi.number()
      .integer()
      .min(1)
      .max(20)
      .required()
      .messages({
        'number.min': 'Mínimo de {#limit} convidado',
        'number.max': 'Máximo de {#limit} convidados',
        'any.required': 'Número de convidados é obrigatório'
      })
  }).required(),

  occasion: Joi.string()
    .valid('aniversario', 'namoro', 'familia', 'negocios', 'outro', '')
    .allow(''),

  specialRequests: Joi.string()
    .max(500)
    .messages({
      'string.max': 'Observações devem ter no máximo {#limit} caracteres'
    })
});

const checkAvailability = Joi.object({
  date: Joi.date()
    .iso()
    .greater('now')
    .required()
    .messages({
      'date.format': 'Data deve estar no formato ISO',
      'date.greater': 'Data deve ser futura',
      'any.required': 'Data é obrigatória'
    }),
  
  time: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .messages({
      'string.pattern.base': 'Horário deve estar no formato HH:MM',
      'any.required': 'Horário é obrigatório'
    }),
  
  guests: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.min': 'Mínimo de {#limit} convidado',
      'any.required': 'Número de convidados é obrigatório'
    })
})
  .and('time', 'guests')
  .messages({
    'object.and': 'Horario e numero de convidados devem ser informados juntos'
  });

export {create, checkAvailability};
