// src/routes/reviewRoutes.js

import { Router } from 'express';
import reviewController from '../controllers/reviewController.js';
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { create as _create, update as _update,
  respond as _respond, moderate as _moderate } from '../validators/reviewValidator.js';
  import rateLimiter from '../middlewares/rateLimiter.js';
  const router = Router();
  
/**
 * @swagger
 * tags:
 *   name: Avaliações
 *   description: Gerenciamento de avaliações e comentários
 */

// ============================
// ROTAS PÚBLICAS
// ============================

// Listar avaliações (com filtros por item, status, ordenação)
router.get(
  '/',
  rateLimiter.menu, // mesmo limitador de cardápio (uso público frequente)
  reviewController.getAll
);

// Estatísticas de avaliação de um item (ou geral)
router.get(
  '/stats',
  rateLimiter.menu,
  reviewController.getStats
);

// ============================
// ROTAS PROTEGIDAS (usuário logado)
// ============================

// Criar avaliação
router.post(
  '/',
  rateLimiter.menu,
  protect,
  rateLimiter.reservation, 
  
  validate(_create),
  reviewController.create
);

// Atualizar avaliação (apenas dono ou admin)
router.put(
  '/:id',
  protect,
  validate(_update),
  reviewController.update
);

// Deletar avaliação (apenas dono ou admin)
router.delete(
  '/:id',
  protect,
  reviewController.delete
);

// ============================
// ROTAS ADMINISTRATIVAS (admin/manager)
// ============================

// Responder a uma avaliação
router.patch(
  '/:id/respond',
  protect,
  authorize('admin', 'manager'),
  validate(_respond),
  reviewController.respond
);

// Aprovar/rejeitar avaliação (moderação)
router.patch(
  '/:id/moderate',
  protect,
  authorize('admin', 'manager'),
  validate(_moderate),
  reviewController.moderate
);

export default router;