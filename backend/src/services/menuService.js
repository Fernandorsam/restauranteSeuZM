// src/services/menuService.js

import { countDocuments, find, findOne, create, findById } from '../models/menuItens.js';
import { find as _find, findOne as _findOne, create as _create,
 findById as _findById, findByIdAndDelete } from '../models/category.js';
import ApiError from '../utils/ApiError.js';
import { business } from '../middlewares/logger.js';

class MenuService {
  // ============================
  // CATEGORIAS
  // ============================

  /**
   * Obter todas as categorias ativas
   */
  async getCategories() {
    return _find({ isActive: true })
      .sort({ name: 1 })
      .lean();
  }

  /**
   * Criar uma nova categoria
   */
  async createCategory(data) {
    const existing = await _findOne({ name: data.name });
    if (existing) {
      throw new ApiError(400, 'Já existe uma categoria com este nome');
    }

    const category = await _create({
      name: data.name,
      description: data.description,
      isActive: data.isActive !== undefined ? data.isActive : true
    });

    business('Categoria criada', { categoryId: category._id, name: category.name });
    return category;
  }

  /**
   * Atualizar uma categoria
   */
  async updateCategory(id, data) {
    const category = await _findById(id);
    if (!category) {
      throw new ApiError(404, 'Categoria não encontrada');
    }

    // Verificar duplicidade de nome, se alterado
    if (data.name && data.name !== category.name) {
      const duplicate = await _findOne({ name: data.name, _id: { $ne: id } });
      if (duplicate) {
        throw new ApiError(400, 'Já existe uma categoria com este nome');
      }
    }

    Object.assign(category, data);
    await category.save();

    business('Categoria atualizada', { categoryId: category._id });
    return category;
  }

  /**
   * Remover categoria (soft delete ou inativar)
   */
  async deleteCategory(id) {
    const category = await _findById(id);
    if (!category) {
      throw new ApiError(404, 'Categoria não encontrada');
    }

    // Verificar se há itens vinculados a esta categoria
    const itemsCount = await countDocuments({ category: id, isAvailable: true });
    if (itemsCount > 0) {
      // Apenas desativar a categoria se houver itens ativos
      category.isActive = false;
      await category.save();
      business('Categoria desativada (possui itens ativos)', { categoryId: id });
      return { message: 'Categoria desativada porque há itens vinculados' };
    }

    // Se não houver itens, remover permanentemente
    await findByIdAndDelete(id);
    business('Categoria removida', { categoryId: id });
    return { message: 'Categoria removida permanentemente' };
  }

  // ============================
  // ITENS DO CARDÁPIO
  // ============================

  /**
   * Listar itens com filtros e paginação
   */
  async getItems(filters = {}, options = {}) {
    const { page = 1, limit = 12, sort = { name: 1 } } = options;

    const query = find(filters)
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const [items, total] = await Promise.all([
      query.lean(),
      countDocuments(filters)
    ]);

    return {
      data: items,
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
   * Buscar item por ID ou slug
   */
  async getItemByIdOrSlug(idOrSlug) {
    const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

    const item = await findOne(query)
      .populate('category', 'name slug description');

    if (!item) throw new ApiError(404, 'Item não encontrado');
    return item;
  }

  /**
   * Pesquisa textual nos itens (nome, descrição, tags)
   */
  async searchItems(term, options = {}) {
    const { page = 1, limit = 12 } = options;

    const searchRegex = new RegExp(term, 'i');

    const filters = {
      isAvailable: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ]
    };

    const query = find(filters)
      .populate('category', 'name slug')
      .sort({ isPopular: -1, averageRating: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const [items, total] = await Promise.all([
      query.lean(),
      countDocuments(filters)
    ]);

    return {
      data: items,
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
   * Obter itens populares
   */
  async getPopularItems(limit = 8) {
    return find({ isAvailable: true, isPopular: true })
      .populate('category', 'name slug')
      .sort({ averageRating: -1, numberOfReviews: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Criar novo item do cardápio
   */
  async createItem(data) {
    // Verificar categoria
    const category = await _findById(data.category);
    if (!category) {
      throw new ApiError(400, 'Categoria inválida');
    }

    // Preço promocional não pode ser maior que o preço original
    if (data.promotionalPrice && data.promotionalPrice >= data.price) {
      throw new ApiError(400, 'Preço promocional deve ser menor que o preço original');
    }

    const item = await create(data);

    business('Item do cardápio criado', { itemId: item._id, name: item.name });
    return item.populate('category', 'name slug');
  }

  /**
   * Atualizar item do cardápio
   */
  async updateItem(id, data) {
    const item = await findById(id);
    if (!item) {
      throw new ApiError(404, 'Item não encontrado');
    }

    // Validar preços se ambos forem fornecidos
    if (data.price !== undefined && data.promotionalPrice !== undefined) {
      if (data.promotionalPrice >= data.price) {
        throw new ApiError(400, 'Preço promocional deve ser menor que o preço original');
      }
    } else if (data.promotionalPrice !== undefined && data.promotionalPrice >= item.price) {
      throw new ApiError(400, 'Preço promocional deve ser menor que o preço original');
    }

    // Verificar categoria se alterada
    if (data.category && data.category !== item.category.toString()) {
      const category = await _findById(data.category);
      if (!category) {
        throw new ApiError(400, 'Categoria inválida');
      }
    }

    Object.assign(item, data);
    await item.save();

    business('Item do cardápio atualizado', { itemId: item._id });
    return item.populate('category', 'name slug');
  }

  /**
   * Remover/desativar item do cardápio (soft delete)
   */
  async deleteItem(id) {
    const item = await findById(id);
    if (!item) {
      throw new ApiError(404, 'Item não encontrado');
    }

    // Apenas desativa o item (não remove permanentemente para preservar histórico)
    item.isAvailable = false;
    await item.save();

    business('Item do cardápio desativado', { itemId: item._id, name: item.name });
    return { message: 'Item desativado com sucesso' };
  }
}

export default new MenuService();