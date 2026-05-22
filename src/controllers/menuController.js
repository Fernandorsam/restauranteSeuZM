// src/controllers/menuController.js

import menuService from '../services/menuService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

class MenuController {
  /**
   * @swagger
   * /api/menu/categories:
   *   get:
   *     tags: [Cardápio]
   *     summary: Listar todas as categorias do cardápio
   *     responses:
   *       200:
   *         description: Lista de categorias
   */
  getCategories = asyncHandler(async (req, res) => {
    const categories = await menuService.getCategories();
    return ApiResponse.success(res, 'Categorias listadas com sucesso', { categories });
  });

  /**
   * @swagger
   * /api/menu/items:
   *   get:
   *     tags: [Cardápio]
   *     summary: Listar itens do cardápio com filtros opcionais
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Slug da categoria
   *       - in: query
   *         name: available
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: popular
   *         schema:
   *           type: boolean
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
   *         description: Lista paginada de itens
   */
  getItems = asyncHandler(async (req, res) => {
    const { category, available, popular, page, limit } = req.query;
    const filters = {};

    if (category) filters.category = category;
    if (available !== undefined) filters.isAvailable = available === 'true';
    if (popular !== undefined) filters.isPopular = popular === 'true';

    const result = await menuService.getItems(filters, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12
    });

   return ApiResponse.paginated(res, 'Itens listados com sucesso', result);
  });

  /**
   * @swagger
   * /api/menu/items/{idOrSlug}:
   *   get:
   *     tags: [Cardápio]
   *     summary: Obter um item do cardápio por ID ou slug
   *     parameters:
   *       - in: path
   *         name: idOrSlug
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Item encontrado
   *       404:
   *         description: Item não encontrado
   */
  getItem = asyncHandler(async (req, res) => {
    const item = await menuService.getItemByIdOrSlug(req.params.idOrSlug);
    if (!item) {
      return ApiResponse.notFound(res, 'Item não encontrado');
    }
    return ApiResponse.success(res, 'Item encontrado', { item });
  });

  /**
   * @swagger
   * /api/menu/search:
   *   get:
   *     tags: [Cardápio]
   *     summary: Pesquisar itens do cardápio
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         required: true
   *         description: Termo de busca
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
   *         description: Resultados da busca
   */
  searchItems = asyncHandler(async (req, res) => {
    const { q, page, limit } = req.query;
    if (!q) {
      return ApiResponse.error(res, 'Termo de busca é obrigatório', 400);
    }

    const result = await menuService.searchItems(q, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12
    });

    return ApiResponse.paginated(res, 'Busca realizada com sucesso', result);
  });

  /**
   * @swagger
   * /api/menu/popular:
   *   get:
   *     tags: [Cardápio]
   *     summary: Obter itens populares (destaques)
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Itens populares
   */
  getPopularItems = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 8;
    const items = await menuService.getPopularItems(limit);
    return ApiResponse.success(res, 'Itens populares', { items });
  });

  // ============================
  // ADMINISTRATIVO
  // ============================

  /**
   * @swagger
   * /api/menu/items:
   *   post:
   *     tags: [Cardápio]
   *     summary: Criar novo item do cardápio (admin/manager)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MenuItem'
   *     responses:
   *       201:
   *         description: Item criado
   */
  createItem = asyncHandler(async (req, res) => {
    const item = await menuService.createItem(req.body);
    return ApiResponse.created(res, 'Item criado com sucesso', { item });
  });

  /**
   * @swagger
   * /api/menu/items/{id}:
   *   put:
   *     tags: [Cardápio]
   *     summary: Atualizar item do cardápio (admin/manager)
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
   *         description: Item atualizado
   */
  updateItem = asyncHandler(async (req, res) => {
    const item = await menuService.updateItem(req.params.id, req.body);
    return ApiResponse.success(res, 'Item atualizado com sucesso', { item });
  });

  /**
   * @swagger
   * /api/menu/items/{id}:
   *   delete:
   *     tags: [Cardápio]
   *     summary: Remover/desativar item do cardápio (admin/manager)
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
   *         description: Item removido/desativado
   */
  deleteItem = asyncHandler(async (req, res) => {
    await menuService.deleteItem(req.params.id);
    return ApiResponse.success(res, 'Item removido com sucesso');
  });

  /**
   * @swagger
   * /api/menu/categories:
   *   post:
   *     tags: [Cardápio]
   *     summary: Criar nova categoria (admin/manager)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Categoria criada
   */
  createCategory = asyncHandler(async (req, res) => {
    const category = await menuService.createCategory(req.body);
    return ApiResponse.created(res, 'Categoria criada com sucesso', { category });
  });

  /**
   * @swagger
   * /api/menu/categories/{id}:
   *   put:
   *     tags: [Cardápio]
   *     summary: Atualizar categoria (admin/manager)
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
   *         description: Categoria atualizada
   */
  updateCategory = asyncHandler(async (req, res) => {
    const category = await menuService.updateCategory(req.params.id, req.body);
    return ApiResponse.success(res, 'Categoria atualizada com sucesso', { category });
  });

  /**
   * @swagger
   * /api/menu/categories/{id}:
   *   delete:
   *     tags: [Cardápio]
   *     summary: Remover categoria (admin/manager)
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
   *         description: Categoria removida
   */
  deleteCategory = asyncHandler(async (req, res) => {
    await menuService.deleteCategory(req.params.id);
    return ApiResponse.success(res, 'Categoria removida com sucesso');
  });
}
const menuController = new MenuController();
export default menuController;