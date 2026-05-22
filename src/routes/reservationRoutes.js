// src/routes/reservationRoutes.js

import express from 'express';
const router = express.Router();
import reservationController from '../controllers/reservationControl.js';
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import {create, checkAvailability} from '../validators/reservationValidator.js';
import rateLimiter from '../middlewares/rateLimiter.js';

/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Gerenciamento de reservas
 */

// Rotas públicas
router.post(
  '/',
  rateLimiter.reservation,
  validate(create),
  reservationController.create
);

router.get(
  '/availability',
  validate(checkAvailability),
  reservationController.checkAvailability
);

// Rotas protegidas (cliente logado)
router.use(protect);

router.get(
  '/',
  rateLimiter.menu,
  reservationController.getAll
);

router.get(
  '/:id',
  reservationController.getById
);

// ✅ CORRIGIDO: usando reservationController.confirm e reservationController.cancel
router.patch(
  '/:id/confirm',
  authorize('admin', 'manager'),
  reservationController.confirm
);

router.patch(
  '/:id/cancel',
  authorize('admin', 'manager'),
  reservationController.cancel
);

export default router;