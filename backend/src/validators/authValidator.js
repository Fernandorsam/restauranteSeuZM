// src/validators/authValidator.js

import { string, ref, object, boolean, array } from 'joi';

// Regras comuns para senha
const passwordRule = string()
  .min(6)
  .max(128)
  .required()
  .messages({
    'string.empty': 'Senha é obrigatória',
    'string.min': 'A senha deve ter no mínimo {#limit} caracteres',
    'string.max': 'A senha deve ter no máximo {#limit} caracteres',
    'any.required': 'Senha é obrigatória'
  });

const passwordConfirmRule = string()
  .valid(ref('password'))
  .required()
  .messages({
    'any.only': 'As senhas não conferem',
    'any.required': 'Confirmação de senha é obrigatória'
  });

const passwordConfirmOptionalRule = string()
  .valid(ref('newPassword'))
  .messages({
    'any.only': 'As senhas não conferem'
  });

// Validação para registro
const register = object({
  name: string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Nome é obrigatório',
      'string.min': 'Nome deve ter no mínimo {#limit} caracteres',
      'string.max': 'Nome deve ter no máximo {#limit} caracteres',
      'any.required': 'Nome é obrigatório'
    }),

  email: string()
    .email()
    .required()
    .messages({
      'string.email': 'E-mail inválido',
      'string.empty': 'E-mail é obrigatório',
      'any.required': 'E-mail é obrigatório'
    }),

  password: passwordRule,

  passwordConfirm: passwordConfirmRule,

  phone: string()
    .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Telefone deve estar no formato (XX) XXXXX-XXXX'
    })
});

// Validação para login
const login = object({
  email: string()
    .email()
    .required()
    .messages({
      'string.email': 'E-mail inválido',
      'string.empty': 'E-mail é obrigatório',
      'any.required': 'E-mail é obrigatório'
    }),

  password: string()
    .required()
    .messages({
      'string.empty': 'Senha é obrigatória',
      'any.required': 'Senha é obrigatória'
    })
});

// Validação para reenviar verificação de e-mail
const resendVerification = object({
  email: string()
    .email()
    .required()
    .messages({
      'string.email': 'E-mail inválido',
      'string.empty': 'E-mail é obrigatório',
      'any.required': 'E-mail é obrigatório'
    })
});

// Validação para "esqueci a senha"
const forgotPassword = object({
  email: string()
    .email()
    .required()
    .messages({
      'string.email': 'E-mail inválido',
      'string.empty': 'E-mail é obrigatório',
      'any.required': 'E-mail é obrigatório'
    })
});

// Validação para redefinir senha com token
const resetPassword = object({
  password: passwordRule,
  passwordConfirm: passwordConfirmRule
});

// Validação para atualizar perfil do usuário logado
const updateProfile = object({
  name: string()
    .trim()
    .min(3)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Nome deve ter no mínimo {#limit} caracteres',
      'string.max': 'Nome deve ter no máximo {#limit} caracteres'
    }),

  phone: string()
    .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Telefone deve estar no formato (XX) XXXXX-XXXX'
    }),

  avatar: string()
    .uri()
    .optional()
    .allow('', null)
    .messages({
      'string.uri': 'Avatar deve ser uma URL válida'
    })
}).min(1).messages({
  'object.min': 'Pelo menos um campo deve ser atualizado'
});

// Validação para alterar a própria senha
const changePassword = object({
  currentPassword: string()
    .required()
    .messages({
      'string.empty': 'Senha atual é obrigatória',
      'any.required': 'Senha atual é obrigatória'
    }),

  newPassword: passwordRule,

  newPasswordConfirm: passwordConfirmRule
    .optional() // Já validamos com newPassword, mas garantimos que é obrigatório? Vamos manter como obrigatório via messages
    .messages({
      'any.required': 'Confirmação da nova senha é obrigatória'
    })
});

// Validação para admin atualizar qualquer usuário
const updateUser = object({
  name: string()
    .trim()
    .min(3)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Nome deve ter no mínimo {#limit} caracteres',
      'string.max': 'Nome deve ter no máximo {#limit} caracteres'
    }),

  phone: string()
    .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Telefone deve estar no formato (XX) XXXXX-XXXX'
    }),

  avatar: string()
    .uri()
    .optional()
    .allow('', null)
    .messages({
      'string.uri': 'Avatar deve ser uma URL válida'
    }),

  isActive: boolean()
    .optional(),

  permissions: array()
    .items(string().valid(
      'manage_reservations',
      'manage_menu',
      'manage_users',
      'view_reports',
      'manage_contacts'
    ))
    .optional()
}).min(1).messages({
  'object.min': 'Pelo menos um campo deve ser atualizado'
});

// Validação para alterar role do usuário (admin)
const changeRole = object({
  role: string()
    .valid('admin', 'manager', 'staff', 'customer')
    .required()
    .messages({
      'any.only': 'Papel inválido: valores aceitos são admin, manager, staff, customer',
      'any.required': 'Papel é obrigatório'
    }),

  permissions: array()
    .items(string().valid(
      'manage_reservations',
      'manage_menu',
      'manage_users',
      'view_reports',
      'manage_contacts'
    ))
    .optional()
});

export default {
  register,
  login,
  resendVerification,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  updateUser,
  changeRole
};