// src/routes/authRoutes.js

import { Router } from 'express';
const router = Router();
import { register, login, refreshToken, logout, verifyEmail,
resendVerification, forgotPassword, resetPassword, getMe,
updateProfile, changePassword, deleteMyAccount, getAllUsers,
getUserById, updateUser, deleteUser, changeUserRole } from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { register as _register, login as _login,
resendVerification as _resendVerification, forgotPassword as _forgotPassword,
resetPassword as _resetPassword, updateProfile as _updateProfile,
changePassword as _changePassword, updateUser as _updateUser, changeRole } from '../validators/authValidator.js';
import { auth } from '../middlewares/rateLimiter.js';

/**
 * @swagger
 * tags:
 *   name: Autenticação
 *   description: Registro, login e gerenciamento de usuários
 */

// ============================
// ROTAS PÚBLICAS
// ============================

// Registrar novo usuário (cliente comum)
router.post(
  '/register',
  auth,
  validate(_register),
  register
);

// Login
router.post(
  '/login',
  auth,
  validate(_login),
  login
);

// Refresh token (renovar sessão)
router.post(
  '/refresh-token',
  auth,
  refreshToken
);

// Logout (invalida refresh token)
router.post(
  '/logout',
  protect,
  logout
);

// Verificar e-mail (token enviado por e-mail)
router.get(
  '/verify-email/:token',
  verifyEmail
);

// Solicitar reenvio de verificação de e-mail
router.post(
  '/resend-verification',
  auth,
  validate(_resendVerification),
  resendVerification
);

// Esqueci a senha
router.post(
  '/forgot-password',
  auth,
  validate(_forgotPassword),
  forgotPassword
);

// Resetar senha com token
router.put(
  '/reset-password/:token',
  auth,
  validate(_resetPassword),
  resetPassword
);

// ============================
// ROTAS PROTEGIDAS (usuário logado)
// ============================

// Obter perfil do usuário logado
router.get(
  '/me',
  protect,
  getMe
);

// Atualizar perfil do usuário logado
router.put(
  '/me',
  protect,
  validate(_updateProfile),
  updateProfile
);

// Alterar senha do usuário logado
router.put(
  '/me/password',
  protect,
  validate(_changePassword),
  changePassword
);

// Deletar conta do usuário logado (soft delete)
router.delete(
  '/me',
  protect,
  deleteMyAccount
);

// ============================
// ROTAS ADMINISTRATIVAS (apenas admin)
// ============================

// Listar todos os usuários (admin)
router.get(
  '/users',
  protect,
  authorize('admin'),
  getAllUsers
);

// Obter usuário específico (admin)
router.get(
  '/users/:id',
  protect,
  authorize('admin'),
  getUserById
);

// Atualizar usuário (admin)
router.put(
  '/users/:id',
  protect,
  authorize('admin'),
  validate(_updateUser),
  updateUser
);

// Deletar usuário (admin)
router.delete(
  '/users/:id',
  protect,
  authorize('admin'),
  deleteUser
);

// Alterar papel/permissões de usuário (admin)
router.patch(
  '/users/:id/role',
  protect,
  authorize('admin'),
  validate(changeRole),
  changeUserRole
);

export default router;