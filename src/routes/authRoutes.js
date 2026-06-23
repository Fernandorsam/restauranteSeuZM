// src/routes/authRoutes.js

import { Router } from 'express';
const router = Router();
import authController  from '../controllers/authController.js';
import User from '../models/User.js';
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { register as _register, login as _login,
resendVerification as _resendVerification, forgotPassword as _forgotPassword,
resetPassword as _resetPassword, updateProfile as _updateProfile,
changePassword as _changePassword, updateUser as _updateUser, changeRole } from '../validators/authValidator.js';
import rateLimiter from '../middlewares/rateLimiter.js';

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
  rateLimiter.auth,
  validate(_register),
  authController.register
);

// Login
router.post(
  '/login',
  rateLimiter.auth,
  validate(_login),
  authController.login
);

// Refresh token (renovar sessão)
router.post(
  '/refresh-token',
  rateLimiter.auth,
  authController.refreshToken
);

// Logout (invalida refresh token)
router.post(
  '/logout',
  protect,
  authController.logout
);

// Verificar e-mail (token enviado por e-mail)
router.get(
  '/verify-email/:token',
  authController.verifyEmail
);

// Solicitar reenvio de verificação de e-mail
router.post(
  '/resend-verification',
  rateLimiter.auth,
  validate(_resendVerification),
  authController.resendVerification
);

// Esqueci a senha
router.post(
  '/forgot-password',
  rateLimiter.auth,
  validate(_forgotPassword),
  authController.forgotPassword
);

// Resetar senha com token
router.put(
  '/reset-password/:token',
  rateLimiter.auth,
  validate(_resetPassword),
  authController.resetPassword
);

// ============================
// ROTAS PROTEGIDAS (usuário logado)
// ============================

// Obter perfil do usuário logado
router.get(
  '/me',
  protect,
   authController.getMe
);

// Atualizar perfil do usuário logado
router.put(
  '/me',
  rateLimiter.auth,
  protect,
  validate(_updateProfile),
   authController.updateProfile
);

// Alterar senha do usuário logado
router.put(
  '/me/password',
  rateLimiter.auth,
  protect,
  validate(_changePassword),
  authController.changePassword
);

// Deletar conta do usuário logado (soft delete)
router.delete(
  '/me',
  protect,
  authController.deleteMyAccount
);

// ============================
// ROTAS DE DEBUG (REMOVER EM PRODUÇÃO)
// ============================

// Debug: Retornar informações do usuário autenticado
router.get(
  '/debug/me',
  protect,
  (req, res) => {
    console.log('🐛 DEBUG /me - Usuário em req.user:');
    console.log('  - _id:', req.user._id);
    console.log('  - id:', req.user.id);
    console.log('  - email:', req.user.email);
    console.log('  - name:', req.user.name);
    console.log('  - role:', req.user.role);
    
    res.json({
      success: true,
      message: 'Debug info',
      data: {
        _id: req.user._id,
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      }
    });
  }
);

// Debug: Verificar se usuário específico existe no banco de dados
router.post(
  '/debug/find-by-id',
  async (req, res) => {
    try {
      const { userId } = req.body;
      console.log('🔍 Procurando usuário com ID:', userId);
      
      const user = await User.findById(userId);
      
      if (user) {
        console.log('✅ Usuário encontrado:', user.email);
        res.json({ success: true, found: true, user: { _id: user._id, email: user.email, name: user.name } });
      } else {
        console.log('❌ Usuário NÃO encontrado com esse ID');
        res.json({ success: true, found: false, message: 'Usuário não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error.message);
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// ============================
// ROTAS ADMINISTRATIVAS (apenas admin)
// ============================

// Listar todos os usuários (admin)
router.get(
  '/users',
  protect,
  authorize('admin'),
  authController.getAllUsers
);

// Obter usuário específico (admin)
router.get(
  '/users/:id',
  protect,
  authorize('admin'),
  authController.getUserById
);

// Atualizar usuário (admin)
router.put(
  '/users/:id',
  protect,
  authorize('admin'),
  validate(_updateUser),
  authController.updateUser
);

// Deletar usuário (admin)
router.delete(
  '/users/:id',
  protect,
  authorize('admin'),
  authController.deleteUser
);

// Alterar papel/permissões de usuário (admin)
router.patch(
  '/users/:id/role',
  protect,
  authorize('admin'),
  validate(changeRole),
  authController.changeUserRole
);

export default router;