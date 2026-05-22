// src/controllers/authController.js

import { register as _register, login as _login, refreshAccessToken, logout as _logout,
verifyEmail as _verifyEmail, resendVerificationEmail, forgotPassword as _forgotPassword,
resetPassword as _resetPassword, getProfile, updateProfile as _updateProfile,
changePassword as _changePassword, deleteAccount, getAllUsers as _getAllUsers,
getUserById as _getUserById, updateUser as _updateUser, deleteUser as _deleteUser,
changeUserRole as _changeUserRole } from '../services/authService.js';
import { created, success, paginated } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../middlewares/logger.js';

class AuthController {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags: [Autenticação]
   *     summary: Registrar novo usuário (cliente)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       201:
   *         description: Usuário registrado com sucesso
   *       400:
   *         description: Dados inválidos
   */
  register = asyncHandler(async (req, res) => {
    const { user, token } = await _register(req.body);
    return created(res, 'Registro realizado com sucesso. Verifique seu e-mail.', {
      user: user.toPublicProfile(),
      token
    });
  });

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags: [Autenticação]
   *     summary: Login do usuário
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login bem-sucedido
   *       401:
   *         description: Credenciais inválidas
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token, refreshToken } = await _login(email, password);

    // Definir refresh token como cookie HTTP-only
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    return success(res, 'Login realizado com sucesso', {
      user: user.toPublicProfile(),
      token
    });
  });

  /**
   * @swagger
   * /api/auth/refresh-token:
   *   post:
   *     tags: [Autenticação]
   *     summary: Renovar token de acesso usando refresh token
   *     responses:
   *       200:
   *         description: Token renovado
   *       401:
   *         description: Refresh token inválido
   */
  refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const { token, newRefreshToken } = await refreshAccessToken(refreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return success(res, 'Token renovado com sucesso', { token });
  });

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     tags: [Autenticação]
   *     summary: Logout do usuário (invalida refresh token)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout realizado
   */
  logout = asyncHandler(async (req, res) => {
    await _logout(req.user.id);
    res.clearCookie('refreshToken');
    return success(res, 'Logout realizado com sucesso');
  });

  /**
   * @swagger
   * /api/auth/verify-email/{token}:
   *   get:
   *     tags: [Autenticação]
   *     summary: Verificar e-mail do usuário
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: E-mail verificado
   *       400:
   *         description: Token inválido ou expirado
   */
  verifyEmail = asyncHandler(async (req, res) => {
    await _verifyEmail(req.params.token);
    return success(res, 'E-mail verificado com sucesso');
  });

  /**
   * @swagger
   * /api/auth/resend-verification:
   *   post:
   *     tags: [Autenticação]
   *     summary: Reenviar e-mail de verificação
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *     responses:
   *       200:
   *         description: E-mail reenviado
   */
  resendVerification = asyncHandler(async (req, res) => {
    await resendVerificationEmail(req.body.email);
    return success(res, 'E-mail de verificação reenviado');
  });

  /**
   * @swagger
   * /api/auth/forgot-password:
   *   post:
   *     tags: [Autenticação]
   *     summary: Solicitar reset de senha
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *     responses:
   *       200:
   *         description: E-mail de reset enviado
   */
  forgotPassword = asyncHandler(async (req, res) => {
    await _forgotPassword(req.body.email);
    return success(res, 'Se o e-mail existir, um link de reset foi enviado');
  });

  /**
   * @swagger
   * /api/auth/reset-password/{token}:
   *   put:
   *     tags: [Autenticação]
   *     summary: Resetar senha com token
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - password
   *             properties:
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Senha alterada
   */
  resetPassword = asyncHandler(async (req, res) => {
    await _resetPassword(req.params.token, req.body.password);
    return success(res, 'Senha alterada com sucesso');
  });

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     tags: [Autenticação]
   *     summary: Obter perfil do usuário logado
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dados do perfil
   */
  getMe = asyncHandler(async (req, res) => {
    const user = await getProfile(req.user.id);
    return success(res, 'Perfil obtido', { user: user.toPublicProfile() });
  });

  /**
   * @swagger
   * /api/auth/me:
   *   put:
   *     tags: [Autenticação]
   *     summary: Atualizar perfil do usuário logado
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               phone:
   *                 type: string
   *               avatar:
   *                 type: string
   *     responses:
   *       200:
   *         description: Perfil atualizado
   */
  updateProfile = asyncHandler(async (req, res) => {
    const user = await _updateProfile(req.user.id, req.body);
    return success(res, 'Perfil atualizado', { user: user.toPublicProfile() });
  });

  /**
   * @swagger
   * /api/auth/me/password:
   *   put:
   *     tags: [Autenticação]
   *     summary: Alterar senha do usuário logado
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Senha alterada
   */
  changePassword = asyncHandler(async (req, res) => {
    await _changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    return success(res, 'Senha alterada com sucesso');
  });

  /**
   * @swagger
   * /api/auth/me:
   *   delete:
   *     tags: [Autenticação]
   *     summary: Deletar conta do usuário logado (soft delete)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Conta desativada
   */
  deleteMyAccount = asyncHandler(async (req, res) => {
    await deleteAccount(req.user.id);
    res.clearCookie('refreshToken');
    return success(res, 'Conta desativada com sucesso');
  });

  // ============================
  // ADMINISTRATIVO
  // ============================

  /**
   * @swagger
   * /api/auth/users:
   *   get:
   *     tags: [Autenticação]
   *     summary: Listar todos os usuários (admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de usuários
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, role } = req.query;
    const result = await _getAllUsers(
      { role },
      { page, limit }
    );
    return paginated(res, 'Usuários listados', result);
  });

  /**
   * @swagger
   * /api/auth/users/{id}:
   *   get:
   *     tags: [Autenticação]
   *     summary: Obter usuário por ID (admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Usuário encontrado
   */
  getUserById = asyncHandler(async (req, res) => {
    const user = await _getUserById(req.params.id);
    return success(res, 'Usuário encontrado', { user: user.toPublicProfile() });
  });

  /**
   * @swagger
   * /api/auth/users/{id}:
   *   put:
   *     tags: [Autenticação]
   *     summary: Atualizar usuário (admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Usuário atualizado
   */
  updateUser = asyncHandler(async (req, res) => {
    const user = await _updateUser(req.params.id, req.body);
    return success(res, 'Usuário atualizado', { user: user.toPublicProfile() });
  });

  /**
   * @swagger
   * /api/auth/users/{id}:
   *   delete:
   *     tags: [Autenticação]
   *     summary: Deletar usuário (admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Usuário removido
   */
  deleteUser = asyncHandler(async (req, res) => {
    await _deleteUser(req.params.id);
    return success(res, 'Usuário removido');
  });

  /**
   * @swagger
   * /api/auth/users/{id}/role:
   *   patch:
   *     tags: [Autenticação]
   *     summary: Alterar papel/permissões de um usuário (admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - role
   *             properties:
   *               role:
   *                 type: string
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Papel alterado
   */
  changeUserRole = asyncHandler(async (req, res) => {
    const user = await _changeUserRole(req.params.id, req.body.role, req.body.permissions);
    return success(res, 'Papel do usuário atualizado', { user: user.toPublicProfile() });
  });
}

export default new AuthController();