// src/services/authService.js

import { createHash } from 'crypto';
import { findOne, create, findByEmailWithPassword, findById, findByIdAndUpdate,
find, countDocuments, findByIdAndDelete } from '../models/User.js';
import { sendEmail } from './emailService.js';
import { business, info } from '../middlewares/logger.js';
import ApiError from '../utils/ApiError.js';
import { FRONTEND_URL } from '../config/environment.js';

class AuthService {
  /**
   * Registra um novo usuário (role = customer por padrão).
   * Gera token de verificação de e-mail e envia.
   * @param {object} data - { name, email, password, phone? }
   * @returns {Promise<{ user, token }>}
   */
  async register(data) {
    // Verificar se email já existe
    const existingUser = await findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, 'E-mail já cadastrado');
    }

    // Criar usuário (role fixo como 'customer')
    const user = await create({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: 'customer',
    });

    // Gerar token de verificação de e-mail
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Enviar e-mail de verificação
    await this.#sendVerificationEmail(user, verificationToken);

    // Gerar token de acesso
    const token = user.generateAuthToken();

    business('Novo usuário registrado', { userId: user._id, email: user.email });

    return { user, token };
  }

  /**
   * Realiza login, retorna tokens de acesso e refresh.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ user, token, refreshToken }>}
   */
  async login(email, password) {
    const user = await findByEmailWithPassword(email.toLowerCase());
    if (!user) {
      throw new ApiError(401, 'Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Conta desativada. Entre em contato com o suporte.');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Credenciais inválidas');
    }

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });

    business('Login realizado', { userId: user._id, email: user.email });

    return { user, token, refreshToken };
  }

  /**
   * Renova o access token usando refresh token (rotação).
   * @param {string} refreshTokenValue - token opaco recebido
   * @returns {Promise<{ token, newRefreshToken }>}
   */
  async refreshAccessToken(refreshTokenValue) {
    if (!refreshTokenValue) {
      throw new ApiError(401, 'Refresh token não fornecido');
    }

    const hashedToken = createHash('sha256').update(refreshTokenValue).digest('hex');

    // Buscar usuário pelo refresh token
    const user = await findOne({ refreshToken: hashedToken }).select('+refreshToken');
    if (!user) {
      throw new ApiError(401, 'Refresh token inválido');
    }

    // Invalidar refresh token atual (rotação)
    user.refreshToken = undefined;

    // Gerar novos tokens
    const token = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });

    info('Refresh token rotacionado', { userId: user._id });

    return { token, newRefreshToken };
  }

  /**
   * Realiza logout, removendo refresh token.
   * @param {string} userId
   */
  async logout(userId) {
    const user = await findById(userId).select('+refreshToken');
    if (user) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }

  /**
   * Verifica o e-mail do usuário com base no token.
   * @param {string} plainToken - token recebido por e-mail
   */
  async verifyEmail(plainToken) {
    const hashedToken = createHash('sha256').update(plainToken).digest('hex');

    const user = await findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, 'Token de verificação inválido ou expirado');
    }

    // Marcar como verificado
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    business('E-mail verificado', { userId: user._id, email: user.email });
  }

  /**
   * Reenvia e-mail de verificação.
   * @param {string} email
   */
  async resendVerificationEmail(email) {
    const user = await findOne({ email: email.toLowerCase() });
    if (!user) {
      // Por segurança, não revelamos se o e-mail existe
      return;
    }

    if (user.isVerified) {
      throw new ApiError(400, 'E-mail já foi verificado');
    }

    // Gerar novo token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    await this.#sendVerificationEmail(user, verificationToken);
    info('E-mail de verificação reenviado', { userId: user._id });
  }

  /**
   * Solicita reset de senha (envia e-mail com token).
   * @param {string} email
   */
  async forgotPassword(email) {
    const user = await findOne({ email: email.toLowerCase() });
    if (!user) {
      // Retorna sucesso mesmo que o e-mail não exista (segurança)
      return;
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    await this.#sendPasswordResetEmail(user, resetToken);
    business('Solicitação de reset de senha', { userId: user._id });
  }

  /**
   * Reseta a senha usando token enviado por e-mail.
   * @param {string} plainToken - token recebido
   * @param {string} newPassword
   */
  async resetPassword(plainToken, newPassword) {
    const hashedToken = createHash('sha256').update(plainToken).digest('hex');

    const user = await findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, 'Token inválido ou expirado');
    }

    // Atualizar senha (o middleware pre-save fará o hash)
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    business('Senha redefinida', { userId: user._id });
  }

  /**
   * Obtém perfil do usuário autenticado.
   * @param {string} userId
   */
  async getProfile(userId) {
    const user = await findById(userId);
    if (!user) throw new ApiError(404, 'Usuário não encontrado');
    return user;
  }

  /**
   * Atualiza dados do perfil (nome, telefone, avatar).
   * @param {string} userId
   * @param {object} data
   */
  async updateProfile(userId, data) {
    const allowedUpdates = ['name', 'phone', 'avatar'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (data[key] !== undefined) updates[key] = data[key];
    }

    const user = await findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) throw new ApiError(404, 'Usuário não encontrado');
    business('Perfil atualizado', { userId: user._id });
    return user;
  }

  /**
   * Altera senha do usuário logado.
   * @param {string} userId
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await findById(userId).select('+password');
    if (!user) throw new ApiError(404, 'Usuário não encontrado');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new ApiError(401, 'Senha atual incorreta');

    user.password = newPassword;
    // Invalidar tokens de reset e refresh por segurança
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    user.refreshToken = undefined;
    await user.save();

    business('Senha alterada', { userId: user._id });
  }

  /**
   * Desativa a conta do usuário (soft delete).
   * @param {string} userId
   */
  async deleteAccount(userId) {
    const user = await findById(userId);
    if (!user) throw new ApiError(404, 'Usuário não encontrado');

    user.isActive = false;
    user.email = `${user.email}_deleted_${Date.now()}`; // libera e-mail para novo cadastro
    await user.save({ validateBeforeSave: false });

    business('Conta desativada', { userId: user._id });
  }

  // ==========================================
  // MÉTODOS ADMINISTRATIVOS
  // ==========================================

  async getAllUsers(filters = {}, options = {}) {
    const { page = 1, limit = 10 } = options;
    const query = find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const [users, total] = await Promise.all([
      query.lean(),
      countDocuments(filters),
    ]);

    return {
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId) {
    const user = await findById(userId);
    if (!user) throw new ApiError(404, 'Usuário não encontrado');
    return user;
  }

  async updateUser(userId, data) {
    // Restringir campos que podem ser alterados pelo admin
    const allowedUpdates = ['name', 'phone', 'avatar', 'isActive', 'permissions'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (data[key] !== undefined) updates[key] = data[key];
    }

    const user = await findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) throw new ApiError(404, 'Usuário não encontrado');
    business('Admin atualizou usuário', { userId: user._id });
    return user;
  }

  async deleteUser(userId) {
    const user = await findById(userId);
    if (!user) throw new ApiError(404, 'Usuário não encontrado');

    await findByIdAndDelete(userId);
    business('Admin removeu usuário permanentemente', { userId });
  }

  async changeUserRole(userId, role, permissions = []) {
    const user = await findById(userId);
    if (!user) throw new ApiError(404, 'Usuário não encontrado');

    user.role = role;
    user.permissions = permissions;
    await user.save();

    business('Papel de usuário alterado', { userId, newRole: role });
    return user;
  }

  // ==========================================
  // MÉTODOS PRIVADOS (envio de e-mails)
  // ==========================================

  async #sendVerificationEmail(user, token) {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
      <h2>Bem-vindo ao Seu Zé & Seu Mané!</h2>
      <p>Olá, <strong>${user.name}</strong>!</p>
      <p>Para começar a aproveitar nossos serviços, confirme seu e-mail clicando no botão abaixo:</p>
      <a href="${verificationUrl}" style="display:inline-block; background-color:#8B4513; color:#ffffff; padding:12px 24px; border-radius:5px; text-decoration:none;">Verificar E-mail</a>
      <p style="margin-top:20px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p>${verificationUrl}</p>
      <p>O link expira em 24 horas.</p>
      <p>Equipe <strong>Seu Zé & Seu Mané</strong></p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Verifique seu e-mail - Seu Zé & Seu Mané',
      html,
    });
  }

  async #sendPasswordResetEmail(user, token) {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
      <h2>Redefinição de Senha</h2>
      <p>Olá, <strong>${user.name}</strong>!</p>
      <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para continuar:</p>
      <a href="${resetUrl}" style="display:inline-block; background-color:#8B4513; color:#ffffff; padding:12px 24px; border-radius:5px; text-decoration:none;">Redefinir Senha</a>
      <p style="margin-top:20px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p>${resetUrl}</p>
      <p>O link expira em 1 hora.</p>
      <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
      <p>Equipe <strong>Seu Zé & Seu Mané</strong></p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Redefinição de senha - Seu Zé & Seu Mané',
      html,
    });
  }
}

export default new AuthService();