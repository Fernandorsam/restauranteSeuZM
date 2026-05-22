// src/controllers/reviewController.js

import reviewService from '../services/reviewService.js';
import apiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

class ReviewController {
  /**
   * @swagger
   * /api/reviews:
   *   get:
   *     tags: [Avaliações]
   *     summary: Listar avaliações com filtros
   *     parameters:
   *       - in: query
   *         name: item
   *         schema:
   *           type: string
   *         description: ID do item do cardápio
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, approved, rejected]
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista paginada de avaliações
   */
  getAll = asyncHandler(async (req, res) => {
    const { item, status, page, limit } = req.query;
    const filters = {};

    if (item) filters.item = item;
    if (status) filters.status = status;
    else filters.status = 'approved'; // por padrão, apenas aprovadas

    const result = await reviewService.getReviews(filters, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });

    return apiResponse.paginated(res, 'Avaliações listadas com sucesso', result);
  });

  /**
   * @swagger
   * /api/reviews/stats:
   *   get:
   *     tags: [Avaliações]
   *     summary: Obter estatísticas de avaliação (geral ou por item)
   *     parameters:
   *       - in: query
   *         name: item
   *         schema:
   *           type: string
   *         description: ID do item (opcional)
   *     responses:
   *       200:
   *         description: Estatísticas de avaliação
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = await reviewService.getReviewStats(req.query.item);
    return apiResponse.success(res, 'Estatísticas de avaliação', stats);
  });

  /**
   * @swagger
   * /api/reviews:
   *   post:
   *     tags: [Avaliações]
   *     summary: Criar uma avaliação (usuário logado)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - rating
   *               - comment
   *             properties:
   *               item:
   *                 type: string
   *                 description: ID do item do cardápio (opcional para avaliação geral)
   *               rating:
   *                 type: number
   *                 minimum: 1
   *                 maximum: 5
   *               comment:
   *                 type: string
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uri
   *     responses:
   *       201:
   *         description: Avaliação criada e aguardando aprovação
   */
  create = asyncHandler(async (req, res) => {
    const review = await reviewService.createReview(req.user.id, req.body);
    return apiResponse.created(res, 'Avaliação enviada com sucesso. Aguardando moderação.', { review });
  });

  /**
   * @swagger
   * /api/reviews/{id}:
   *   put:
   *     tags: [Avaliações]
   *     summary: Atualizar avaliação (dono ou admin)
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
   *             properties:
   *               rating:
   *                 type: number
   *               comment:
   *                 type: string
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Avaliação atualizada
   */
  update = asyncHandler(async (req, res) => {
    const review = await reviewService.updateReview(req.params.id, req.user, req.body);
    return apiResponse.success(res, 'Avaliação atualizada com sucesso', { review });
  });

  /**
   * @swagger
   * /api/reviews/{id}:
   *   delete:
   *     tags: [Avaliações]
   *     summary: Deletar avaliação (dono ou admin)
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
   *         description: Avaliação removida
   */
  delete = asyncHandler(async (req, res) => {
    await reviewService.deleteReview(req.params.id, req.user);
    return apiResponse.success(res, 'Avaliação removida com sucesso');
  });

  /**
   * @swagger
   * /api/reviews/{id}/respond:
   *   patch:
   *     tags: [Avaliações]
   *     summary: Responder a uma avaliação (admin/manager)
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
   *               - response
   *             properties:
   *               response:
   *                 type: string
   *     responses:
   *       200:
   *         description: Resposta enviada
   */
  respond = asyncHandler(async (req, res) => {
    const review = await reviewService.respondToReview(req.params.id, req.user, req.body.response);
    return apiResponse.success(res, 'Resposta enviada com sucesso', { review });
  });

  /**
   * @swagger
   * /api/reviews/{id}/moderate:
   *   patch:
   *     tags: [Avaliações]
   *     summary: Moderar avaliação (aprovar/rejeitar) - admin/manager
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
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [approved, rejected]
   *               moderationNote:
   *                 type: string
   *     responses:
   *       200:
   *         description: Avaliação moderada
   */
  moderate = asyncHandler(async (req, res) => {
    const review = await reviewService.moderateReview(req.params.id, req.user, req.body.status, req.body.moderationNote);
    return apiResponse.success(res, `Avaliação ${req.body.status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`, { review });
  });
}
const reviewController = new ReviewController();
export default reviewController;