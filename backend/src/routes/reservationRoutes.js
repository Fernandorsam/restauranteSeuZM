// src/routes/reservationRoutes.js
import { Router } from 'express';
const router = Router();
import { create, checkAvailability, getAll, getById, confirm, cancel } from '../controllers/reservationControl.js';
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { create as _create, checkAvailability as _checkAvailability } from '../validators/reservationValidator.js';
import { reservation } from '../middlewares/rateLimiter.js';

/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Gerenciamento de reservas
 */

// Rotas públicas
router.post(
  '/',
  reservation,
  validate(_create),
  create
);

router.get(
  '/availability',
  validate(_checkAvailability),
  checkAvailability
);

// Rotas protegidas (cliente)
router.use(protect);

// Rotas de admin
router.use(authorize('admin', 'manager'));

router.get(
  '/',
  getAll
);

router.get(
  '/:id',
  getById
);

router.patch(
  '/:id/confirm',
  confirm
);

router.patch(
  '/:id/cancel',
  cancel
);

export default router;