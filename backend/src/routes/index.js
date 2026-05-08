// src/routes/index.js
import { Router } from 'express';
const router = Router();

import reservationRoutes from './reservationRoutes.js';
import contactRoutes from './contactRoutes.js';
import menuRoutes from './menuRoutes.js';
import authRoutes from './authRoutes.js';
import reviewRoutes from './reviewRoutes.js';

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/reservations', reservationRoutes);
router.use('/contacts', contactRoutes);
router.use('/menu', menuRoutes);
router.use('/reviews', reviewRoutes);

export default router;