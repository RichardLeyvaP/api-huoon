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
  }
};

module.exports = MealRecipeRepository;