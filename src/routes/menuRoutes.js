// src/routes/menuRoutes.js

import { Router } from 'express';
const router = Router();
import menuController from '../controllers/menuController.js';
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { createItem as _createItem, updateItem as _updateItem,
     createCategory as _createCategory, updateCategory as
      _updateCategory } from '../validators/menuValidator.js';
import rateLimiter from '../middlewares/rateLimiter.js';

/**
 * @swagger
 * tags:
 *   name: Cardápio
 *   description: Gerenciamento do cardápio (itens, categorias)
 */

// ============================
// ROTAS PÚBLICAS
// ============================

// Listar categorias
router.get(
  '/categories',
  rateLimiter.menu,
  menuController.getCategories
);

// Listar itens do cardápio (com filtros opcionais)
router.get(
  '/items',
  rateLimiter.menu,
  menuController.getItems
);

// Buscar item específico por ID ou slug
router.get(
  '/items/:idOrSlug',
  rateLimiter.menu,
  menuController.getItem
);

// Pesquisa avançada de itens
router.get(
  '/search',
  rateLimiter.menu,
  menuController.searchItems
);

// Obter destaques / mais populares
router.get(
  '/popular',
  rateLimiter.menu,
  menuController.getPopularItems
);

// ============================
// ROTAS ADMINISTRATIVAS (protegidas)
// ============================

// Middleware global para rotas seguintes
router.use(protect);
router.use(authorize('admin', 'manager'));

// Criar novo item
router.post(
  '/items',
  validate(_createItem),
  menuController.createItem
);

// Atualizar item
router.put(
  '/items/:id',
  validate(_updateItem),
  menuController.updateItem
);

// Deletar item (soft delete ou desativar)
router.delete(
  '/items/:id',
  menuController.deleteItem
);

// Criar categoria
router.post(
  '/categories',
  validate(_createCategory),
  menuController.createCategory
);

// Atualizar categoria
router.put(
  '/categories/:id',
  validate(_updateCategory),
  menuController.updateCategory
);

// Deletar categoria
router.delete(
  '/categories/:id',
  menuController.deleteCategory
);

export default router;