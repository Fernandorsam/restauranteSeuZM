// src/controllers/contactController.js

import contactService from '../services/contactService.js';
import apiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

class ContactController {
  /**
   * @swagger
   * /api/contacts:
   *   post:
   *     tags: [Contatos]
   *     summary: Enviar mensagem de contato
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - message
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               phone:
   *                 type: string
   *               subject:
   *                 type: string
   *               message:
   *                 type: string
   *     responses:
   *       201:
   *         description: Mensagem enviada com sucesso
   *       400:
   *         description: Dados inválidos
   */
  create = asyncHandler(async (req, res) => {
    const contact = await contactService.createContact(req.body);

    return apiResponse.created(res, 'Mensagem enviada com sucesso! Entraremos em contato em breve.', {
      contact
    });
  });

  /**
   * @swagger
   * /api/contacts:
   *   get:
   *     tags: [Contatos]
   *     summary: Listar todas as mensagens de contato (admin/manager)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [unread, read, archived]
   *     responses:
   *       200:
   *         description: Lista de contatos
   */
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;

    const filters = {};
    if (status) filters.status = status;

    const result = await getContacts(filters, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { createdAt: -1 } // mais recentes primeiro
    });

    return paginated(res, 'Contatos listados com sucesso', result);
  });

  /**
   * @swagger
   * /api/contacts/{id}:
   *   get:
   *     tags: [Contatos]
   *     summary: Obter mensagem de contato por ID (admin/manager)
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
   *         description: Detalhes do contato
   *       404:
   *         description: Contato não encontrado
   */
  getById = asyncHandler(async (req, res) => {
    const contact = await getContactById(req.params.id);

    if (!contact) {
      return notFound(res, 'Mensagem não encontrada');
    }

    return success(res, 'Mensagem encontrada', { contact });
  });

  /**
   * @swagger
   * /api/contacts/{id}:
   *   delete:
   *     tags: [Contatos]
   *     summary: Excluir mensagem de contato (admin/manager)
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
   *         description: Mensagem excluída
   *       404:
   *         description: Contato não encontrado
   */
  delete = asyncHandler(async (req, res) => {
    const contact = await deleteContact(req.params.id);

    if (!contact) {
      return notFound(res, 'Mensagem não encontrada');
    }

    return success(res, 'Mensagem excluída com sucesso');
  });

  /**
   * @swagger
   * /api/contacts/{id}/read:
   *   patch:
   *     tags: [Contatos]
   *     summary: Marcar mensagem como lida (admin/manager)
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
   *         description: Mensagem marcada como lida
   *       404:
   *         description: Contato não encontrado
   */
  markAsRead = asyncHandler(async (req, res) => {
    const contact = await markContactAsRead(req.params.id);

    if (!contact) {
      return notFound(res, 'Mensagem não encontrada');
    }

    return success(res, 'Mensagem marcada como lida', { contact });
  });
}


const contactController = new ContactController();
export default contactController;