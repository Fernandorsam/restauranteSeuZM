// src/routes/reviewRoutes.js

import { Router } from 'express';
const router = Router();
import { getAll, getStats, create, update,
delete as deleteReview, respond, moderate } from '../controllers/reviewController.js';
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { create as _create, update as _update,
respond as _respond, moderate as _moderate } from '../validators/reviewValidator.js';
import { menu, reservation } from '../middlewares/rateLimiter.js';

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
  menu, // mesmo limitador de cardápio (uso público frequente)
  getAll
);

// Estatísticas de avaliação de um item (ou geral)
router.get(
  '/stats',
  menu,
  getStats
);

// ============================
// ROTAS PROTEGIDAS (usuário logado)
// ============================

// Criar avaliação
router.post(
  '/',
  protect,
  reservation, // limitar para evitar spam (15/h)
  validate(_create),
  create
);

// Atualizar avaliação (apenas dono ou admin)
router.put(
  '/:id',
  protect,
  validate(_update),
  update
);

// Deletar avaliação (apenas dono ou admin)
router.delete(
  '/:id',
  protect,
  deleteReview
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
  respond
);

// Aprovar/rejeitar avaliação (moderação)
router.patch(
  '/:id/moderate',
  protect,
  authorize('admin', 'manager'),
  validate(_moderate),
  moderate
);

export default router;