// src/routes/contactRoutes.js

import { Router } from 'express';
const router = Router();
import contactController from '../controllers/contactController.js';
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import createContValidator from '../validators/contactValidator.js';
import rateLimiter from '../middlewares/rateLimiter.js';

/**
 * @swagger
 * tags:
 *   name: Contatos
 *   description: Gerenciamento de contatos/mensagens do site
 */

// Rotas públicas
router.post(
  '/',
  rateLimiter.contact,
  validate(createContValidator),
  contactController.create
);

// Rotas protegidas (admin e manager)
router.use(protect);
router.use(authorize('admin', 'manager'));

router.get(
  '/',
  contactController.getAll
);

router.get(
  '/:id',
  contactController.getById
);

router.delete(
  '/:id',
  contactController.delete
);


router.patch(
  '/:id/read',
   contactController.markAsRead 
);

export default router;