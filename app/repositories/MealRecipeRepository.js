const { MealRecipe, MealEntry, Recipe } = require("../models");
const logger = require("../../config/logger");

const MealRecipeRepository = {
  async findByMealEntryId(meal_entry_id) {
    return await MealRecipe.findAll({
      where: { meal_entry_id },
      include: [{ model: Recipe, as: 'recipe' }],
      order: [['id', 'ASC']]
    });
  },

  async findById(id) {
    return await MealRecipe.findByPk(id, {
      include: [
        { model: MealEntry, as: 'mealEntry' },
        { model: Recipe, as: 'recipe' }
      ]
    });
  },

  async create(body, t) {
    try {
      const item = await MealRecipe.create({
        meal_entry_id: body.meal_entry_id,
        recipe_id: body.recipe_id,
        servings: body.servings
      }, { transaction: t });
      logger.info(`Receta ${body.recipe_id} agregada a comida ${body.meal_entry_id}`);
      return item;
    } catch (err) {
      logger.error(`Error en MealRecipeRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(item, body, t) {
    try {
      if (body.servings !== undefined) {
        await item.update({ servings: body.servings }, { transaction: t });
        logger.info(`Porciones actualizadas (ID: ${item.id})`);
      }
      return item;
    } catch (err) {
      logger.error(`Error en MealRecipeRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(item) {
    try {
      await item.destroy();
      logger.info(`Receta eliminada de comida (ID: ${item.id})`);
      return true;
    } catch (err) {
      logger.error(`Error en MealRecipeRepository->delete: ${err.message}`);
      throw err;
    }
  },
  async upsertForMealEntry(meal_entry_id, mealRecipes, transaction) {
  // 1. Obtener asociaciones actuales
  const current = await MealRecipe.findAll({ where: { meal_entry_id }, transaction });
  const currentIds = new Set(current.map(mr => mr.recipe_id));

  // 2. Eliminar las que ya no están
  const toDelete = current.filter(mr => !mealRecipes.some(m => m.recipe_id === mr.recipe_id));
  if (toDelete.length > 0) {
    await MealRecipe.destroy({
      where: { id: toDelete.map(mr => mr.id) },
      transaction
    });
  }

  // 3. Crear/actualizar
  for (const mr of mealRecipes) {
    const existing = current.find(m => m.recipe_id === mr.recipe_id);
    if (existing) {
      await existing.update({ servings: mr.servings }, { transaction });
    } else {
      await MealRecipe.create({
        meal_entry_id,
        recipe_id: mr.recipe_id,
        servings: mr.servings
      }, { transaction });
    }
  }
},
};

module.exports = MealRecipeRepository;