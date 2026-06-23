// src/services/reviewService.js

import Review from '../models/review.js';
import MenuItem from '../models/menuItens.js';
import ApiError from '../utils/ApiError.js';
import { business, error as _error } from '../middlewares/logger.js';
import notificationService from './notificationService.js'; 

class ReviewService {
  /**
   * Cria uma nova avaliação (status inicial: 'pending').
   * @param {string} userId - ID do usuário autenticado
   * @param {object} data - { item, rating, comment, images }
   * @returns {Promise<Object>} review criada
   */
  async createReview(userId, data) {
    // Verificar se o item existe (se item for informado)
    if (data.item) {
      const item = await MenuItem.findById(data.item);
      if (!item) {
        throw new ApiError(404, 'Item do cardápio não encontrado');
      }
    }

    // Impedir avaliação duplicada (um usuário só pode avaliar um item uma vez, se item for especificado)
    if (data.item) {
      const existing = await Review.findOne({ user: userId, item: data.item });
      if (existing) {
        throw new ApiError(400, 'Você já avaliou este item. Edite sua avaliação existente.');
      }
    }

    const review = await Review.create({
      user: userId,
      item: data.item || null,
      rating: data.rating,
      comment: data.comment,
      images: data.images || [],
      status: 'pending' // aguardará moderação
    });

    // Popular dados do usuário para retorno e eventuais notificações
    await review.populate('user', 'name avatar');

    business('Nova avaliação criada', {
      reviewId: review._id,
      user: userId,
      item: data.item || 'geral',
      rating: data.rating
    });

    // Notificar administradores sobre nova avaliação pendente
    await notificationService.notifyAdminNewReview(review);

    return review;
  }

  /**
   * Busca avaliações com filtros e paginação.
   * @param {object} filters - Filtros (item, status, user, etc.)
   * @param {object} options - { page, limit }
   * @returns {Promise<Object>} { data, pagination }
   */
  async getReviews(filters = {}, options = {}) {
    const { page = 1, limit = 10 } = options;

    const query = Review.find(filters)
      .populate('user', 'name avatar')
      .populate('item', 'name slug images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const [reviews, total] = await Promise.all([
      query.lean(),
      Review.countDocuments(filters)
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Obtém estatísticas de avaliações (média, distribuição).
   * @param {string} [itemId] - opcional, para filtrar por item
   * @returns {Promise<Object>} estatísticas
   */
  async getReviewStats(itemId) {
    const match = { status: 'approved' };
    if (itemId) match.item = itemId;

    const stats = await Review.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          distribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (!stats.length) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    // Transformar array de ratings em distribuição
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats[0].distribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    return {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
      distribution
    };
  }

  /**
   * Atualiza a própria avaliação (se for dono) ou qualquer (se admin).
   * @param {string} reviewId
   * @param {object} currentUser - req.user
   * @param {object} data - campos a atualizar (rating, comment, images)
   * @returns {Promise<Object>} review atualizada
   */
  async updateReview(reviewId, currentUser, data) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Avaliação não encontrada');
    }

    // Verificar permissão: dono ou admin/manager
    if (review.user.toString() !== currentUser.id && !['admin', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'Você não tem permissão para editar esta avaliação');
    }

    // Se não for admin, volta para 'pending' após edição
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      review.status = 'pending';
    }

    if (data.rating !== undefined) review.rating = data.rating;
    if (data.comment !== undefined) review.comment = data.comment;
    if (data.images !== undefined) review.images = data.images;

    await review.save();

    business('Avaliação atualizada', {
      reviewId: review._id,
      user: currentUser.id
    });

    return review;
  }

  /**
   * Exclui uma avaliação (soft delete ou hard delete, aqui faremos hard para privacidade).
   * @param {string} reviewId
   * @param {object} currentUser
   */
  async deleteReview(reviewId, currentUser) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Avaliação não encontrada');
    }

    if (review.user.toString() !== currentUser.id && !['admin', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'Você não tem permissão para excluir esta avaliação');
    }

    await Review.findByIdAndDelete(reviewId);

    // Recalcular média do item se existir
    if (review.item) {
      await this.#updateMenuItemRating(review.item);
    }

    business('Avaliação removida', {
      reviewId,
      user: currentUser.id
    });
  }

  /**
   * Responde a uma avaliação (somente admin/manager).
   * @param {string} reviewId
   * @param {object} currentUser
   * @param {string} responseText
   */
  async respondToReview(reviewId, currentUser, responseText) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Avaliação não encontrada');
    }

    review.response = {
      text: responseText,
      user: currentUser.id,
      createdAt: new Date()
    };

    await review.save();

    business('Resposta adicionada à avaliação', {
      reviewId,
      user: currentUser.id
    });

    return review.populate('response.user', 'name');
  }

  /**
   * Modera uma avaliação (aprovar/rejeitar).
   * @param {string} reviewId
   * @param {object} currentUser
   * @param {string} status - 'approved' ou 'rejected'
   * @param {string} [moderationNote]
   */
  async moderateReview(reviewId, currentUser, status, moderationNote) {
    if (!['approved', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Status inválido. Use "approved" ou "rejected".');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApiError(404, 'Avaliação não encontrada');
    }

    const previousStatus = review.status;
    review.status = status;
    review.moderatedBy = currentUser.id;
    review.moderationNote = moderationNote || '';
    review.moderatedAt = new Date();

    await review.save();

    // Se aprovada e pertencer a um item, atualizar a média do item
    if (status === 'approved' && review.item) {
      await this.#updateMenuItemRating(review.item);
    }

    business('Avaliação moderada', {
      reviewId,
      previousStatus,
      newStatus: status,
      moderator: currentUser.id
    });

    return review;
  }

  // ----------------------------------------------------
  // Métodos privados
  // ----------------------------------------------------

  /**
   * Recalcula a média de avaliações de um item do cardápio e atualiza o documento.
   * @param {string} itemId
   */
  async #updateMenuItemRating(itemId) {
    try {
      const stats = await Review.aggregate([
        { $match: { item: itemId, status: 'approved' } },
        {
          $group: {
            _id: '$item',
            averageRating: { $avg: '$rating' },
            numberOfReviews: { $sum: 1 }
          }
        }
      ]);

      if (stats.length > 0) {
        await MenuItem.findByIdAndUpdate(itemId, {
          averageRating: Math.round(stats[0].averageRating * 10) / 10,
          numberOfReviews: stats[0].numberOfReviews
        });
      } else {
        // Nenhuma avaliação aprovada, zerar
        await MenuItem.findByIdAndUpdate(itemId, {
          averageRating: 0,
          numberOfReviews: 0
        });
      }
    } catch (error) {
      _error('Erro ao atualizar média do item:', error);
    }
  }
}

const reviewService = new ReviewService();
export default reviewService;
