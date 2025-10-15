const { MealEntry, DailyLog, Type, MealRecipe, Recipe } = require("../models");
const logger = require("../../config/logger");

const MealEntryRepository = {
  async findAll() {
    return await MealEntry.findAll({
      include: [
        { model: DailyLog, as: 'dailyLog' },
        { model: Type, as: 'mealType' }
      ],
      order: [['createdAt', 'DESC']]
    });
  },

  async findByDailyLogId(daily_log_id) {
    return await MealEntry.findAll({
      where: { daily_log_id },
      include: [
        { model: Type, as: 'mealType' },
        {
          model: MealRecipe,
          as: 'mealRecipes',
          include: [{ model: Recipe, as: 'recipe' }]
        }
      ],
      order: [['type_id', 'ASC']]
    });
  },

  async findById(id) {
    return await MealEntry.findByPk(id, {
      include: [
        { model: DailyLog, as: 'dailyLog' },
        { model: Type, as: 'mealType' },
        {
          model: MealRecipe,
          as: 'mealRecipes',
          include: [{ model: Recipe, as: 'recipe' }]
        }
      ]
    });
  },

  async create(body, t) {
    try {
      const mealEntry = await MealEntry.create({
        daily_log_id: body.daily_log_id,
        type_id: body.type_id,
        notes: body.notes || null
      }, { transaction: t });
      logger.info(`Comida creada (ID: ${mealEntry.id}) para daily_log ${body.daily_log_id}`);
      return mealEntry;
    } catch (err) {
      logger.error(`Error en MealEntryRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(mealEntry, body, t) {
    try {
      const updateData = {};
      if (body.notes !== undefined) updateData.notes = body.notes;
      
      if (Object.keys(updateData).length > 0) {
        await mealEntry.update(updateData, { transaction: t });
        logger.info(`Comida actualizada (ID: ${mealEntry.id})`);
      }
      return mealEntry;
    } catch (err) {
      logger.error(`Error en MealEntryRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(mealEntry) {
    try {
      await mealEntry.destroy();
      logger.info(`Comida eliminada (ID: ${mealEntry.id})`);
      return true;
    } catch (err) {
      logger.error(`Error en MealEntryRepository->delete: ${err.message}`);
      throw err;
    }
  }
};

module.exports = MealEntryRepository;