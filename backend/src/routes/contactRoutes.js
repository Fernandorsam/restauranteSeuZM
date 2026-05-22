// src/routes/contactRoutes.js

import { Router } from 'express';
const router = Router();
import { create, getAll, getById, deleteContact, markAsRead } from '../controllers/contactController.js';
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { create as _create } from '../validators/contactValidator.js';
import { contact } from '../middlewares/rateLimiter.js';

/**
 * @swagger
 * tags:
 *   name: Contatos
 *   description: Gerenciamento de contatos/mensagens do site
 */

// Rotas públicas
router.post(
  '/',
  contact,
  validate(_create),
  create
);

// Rotas protegidas (admin e manager)
router.use(protect);
router.use(authorize('admin', 'manager'));

router.get(
  '/',
  getAll
);

router.get(
  '/:id',
  getById
);

router.delete(
  '/:id',
  deleteContact
);

router.patch(
  '/:id/read',
  markAsRead
);

export default router;