// src/routes/menuRoutes.js

import { Router } from 'express';
const router = Router();
import { getCategories, getItems, getItem, searchItems, getPopularItems, 
createItem, updateItem, deleteItem, createCategory, updateCategory, deleteCategory }
 from '../controllers/menuController.js';
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { createItem as _createItem, updateItem as _updateItem,
     createCategory as _createCategory, updateCategory as
      _updateCategory } from '../validators/menuValidator.js';
import { menu } from '../middlewares/rateLimiter.js';

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
  menu,
  getCategories
);

// Listar itens do cardápio (com filtros opcionais)
router.get(
  '/items',
  menu,
  getItems
);

// Buscar item específico por ID ou slug
router.get(
  '/items/:idOrSlug',
  menu,
  getItem
);

// Pesquisa avançada de itens
router.get(
  '/search',
  menu,
  searchItems
);

// Obter destaques / mais populares
router.get(
  '/popular',
  menu,
  getPopularItems
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
  createItem
);

// Atualizar item
router.put(
  '/items/:id',
  validate(_updateItem),
  updateItem
);

// Deletar item (soft delete ou desativar)
router.delete(
  '/items/:id',
  deleteItem
);

// Criar categoria
router.post(
  '/categories',
  validate(_createCategory),
  createCategory
);

// Atualizar categoria
router.put(
  '/categories/:id',
  validate(_updateCategory),
  updateCategory
);

// Deletar categoria
router.delete(
  '/categories/:id',
  deleteCategory
);

export default router;