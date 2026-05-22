// src/models/User.js

import { Schema, model } from 'mongoose';
import { genSalt, hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { JWT_SECRET, JWT_EXPIRE } from '../config/environment.js';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      minlength: [3, 'Nome deve ter no mínimo 3 caracteres'],
      maxlength: [100, 'Nome deve ter no máximo 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'E-mail é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Por favor, insira um e-mail válido',
      ],
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
      select: false, // Não retorna a senha por padrão nas consultas
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'staff', 'customer'],
        message: 'Papel inválido: {VALUE}',
      },
      default: 'staff',
    },
    phone: {
      type: String,
      match: [
        /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
        'Formato de telefone inválido. Use (XX) XXXXX-XXXX',
      ],
    },
    avatar: {
      type: String, // URL da imagem
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    lastLogin: Date,
    refreshToken: {
      type: String,
      select: false,
    },
    permissions: {
      // Permissões granulares (opcionais)
      type: [String],
      enum: [
        'manage_reservations',
        'manage_menu',
        'manage_users',
        'view_reports',
        'manage_contacts',
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================
// ÍNDICES
// ============================
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ============================
// HOOKS (pré-save)
// ============================

// Hash da senha antes de salvar
userSchema.pre('save', async function (next) {
  // Só faz o hash se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) return next();

  try {
    const salt = await genSalt(12);
    this.password = await hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Se o e-mail foi modificado, invalida verificação anterior
userSchema.pre('save', function (next) {
  if (this.isModified('email')) {
    this.isVerified = false;
    this.emailVerificationToken = undefined;
    this.emailVerificationExpire = undefined;
  }
  next();
});

// ============================
// MÉTODOS DE INSTÂNCIA
// ============================

// Comparar senha fornecida com o hash armazenado
userSchema.methods.comparePassword = async function (candidatePassword) {
  return compare(candidatePassword, this.password);
};

// Gerar JWT de acesso
userSchema.methods.generateAuthToken = function () {
  return sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRE || '30d',
    }
  );
};

// Gerar refresh token (para renovação de sessão)
userSchema.methods.generateRefreshToken = function () {
  const refreshToken = randomBytes(40).toString('hex');
  this.refreshToken = createHash('sha256')
    .update(refreshToken)
    .digest('hex');
  return refreshToken;
};

// Gerar token para verificação de e-mail
userSchema.methods.generateEmailVerificationToken = function () {
  const token = randomBytes(32).toString('hex');
  this.emailVerificationToken = createHash('sha256')
    .update(token)
    .digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  return token;
};

// Verificar token de verificação de e-mail
userSchema.methods.verifyEmailToken = function (token) {
  const hashedToken = createHash('sha256').update(token).digest('hex');
  if (
    this.emailVerificationToken !== hashedToken ||
    this.emailVerificationExpire < Date.now()
  ) {
    return false;
  }
  this.isVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpire = undefined;
  return true;
};

// Gerar token para reset de senha
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = randomBytes(32).toString('hex');
  this.passwordResetToken = createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpire = Date.now() + 60 * 60 * 1000; // 1 hora
  return resetToken;
};

// Limpar token de reset de senha após uso
userSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetToken = undefined;
  this.passwordResetExpire = undefined;
};

// Retornar objeto do usuário sem informações sensíveis
userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.__v;
  return obj;
};

// ============================
// MÉTODOS ESTÁTICOS
// ============================

// Buscar usuário por e-mail (incluindo senha)
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// Buscar usuário por e-mail (sem senha)
userSchema.statics.findByEmail = function (email, additionalSelect = '') {
  return this.findOne({ email: email.toLowerCase() }).select(additionalSelect);
};

// Buscar usuários ativos por role
userSchema.statics.findActiveByRole = function (role) {
  return this.find({ role, isActive: true });
};

// Listar administradores/gerentes para notificações
userSchema.statics.getAdminAndManagerEmails = function () {
  return this.find(
    { role: { $in: ['admin', 'manager'] }, isActive: true },
    { email: 1, _id: 0 }
  ).lean();
};

// ============================
// VIRTUAIS
// ============================

// Nome completo (caso existam campos firstName/lastName)
userSchema.virtual('fullName').get(function () {
  return this.name;
});

// URL do avatar padrão se não houver
userSchema.virtual('avatarUrl').get(function () {
  if (this.avatar) return this.avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    this.name
  )}&background=8B4513&color=FFD700&size=200`;
});

// ============================
// EXPORT
// ============================
const User = model('User', userSchema);

export default User;