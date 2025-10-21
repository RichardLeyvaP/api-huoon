const { MealEntry, DailyLog, Type, MealRecipe, Recipe } = require("../models");
const { Op } = require("sequelize");
const logger = require("../../config/logger");

const MealEntryRepository = {
  async findAll() {
    return await MealEntry.findAll({
      include: [
        { model: DailyLog, as: "dailyLog" },
        { model: Type, as: "type" },
      ],
      order: [["createdAt", "DESC"]],
    });
  },

  async findByDailyLogId(daily_log_id) {
    return await MealEntry.findAll({
      where: { daily_log_id },
      include: [
        { model: Type, as: "type" },
        {
          model: MealRecipe,
          as: "mealRecipes",
          include: [{ model: Recipe, as: "recipe" }],
        },
      ],
      order: [["type_id", "ASC"]],
    });
  },

  // MealEntryRepository.js

  async findByPersonIdAndDate(person_id, date = null) {
    // 1. Determinar rango de fechas
    let dateCondition;
    if (date) {
      dateCondition = date;
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0"); // Mes en 2 dígitos
      const startDate = `${year}-${month}-01`;
      const nextMonth = now.getMonth() + 2;
      const endDate =
        nextMonth > 12
          ? `${year + 1}-01-01`
          : `${year}-${String(nextMonth).padStart(2, "0")}-01`;

      dateCondition = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      };
    }

    // 2. Consulta
    return await MealEntry.findAll({
      include: [
        {
          model: DailyLog,
          as: "dailyLog",
          where: {
            person_id,
            date: dateCondition,
          },
          attributes: ["date"],
        },
        {
          model: Type,
          as: "type",
          attributes: ["name", "description"],
        },
        {
          model: MealRecipe,
          as: "mealRecipes",
          attributes: ["recipe_id", "servings"],
          include: [
            {
              model: Recipe,
              as: "recipe",
              attributes: [
                "name",
                "image",
                "description",
                "servings",
                "calories",
                "protein",
              ],
            },
          ],
        },
      ],
      attributes: ["id", "daily_log_id", "type_id", "notes"],
      order: [
        ["dailyLog", "date", "DESC"],
        ["type_id", "ASC"],
      ],
    });
  },

  async findById(id, t = null) {
    return await MealEntry.findByPk(id, {
      include: [
        { model: DailyLog, as: "dailyLog" },
        { model: Type, as: "type" },
        {
          model: MealRecipe,
          as: "mealRecipes",
          include: [{ model: Recipe, as: "recipe" }],
        },
      ],
    }, { transaction: t});
  },

  async create(body, t) {
    try {
      const mealEntry = await MealEntry.create(
        {
          daily_log_id: body.daily_log_id,
          type_id: body.type_id,
          notes: body.notes || null,
        },
        { transaction: t }
      );
      logger.info(
        `Comida creada (ID: ${mealEntry.id}) para daily_log ${body.daily_log_id}`
      );
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
  },
  
  async deleteByMealEntryId(meal_entry_id, transaction = null) {
    try {
      const options = {
        where: { meal_entry_id }
      };

      // Si se pasa una transacción, la incluimos
      if (transaction) {
        options.transaction = transaction;
      }

      const result = await MealRecipe.destroy(options);

      logger.info(`Se eliminaron ${result} MealRecipe(s) para meal_entry_id: ${meal_entry_id}`);
      return result; // número de registros eliminados
    } catch (err) {
      logger.error(`Error en MealRecipeRepository->deleteByMealEntryId: ${err.message}`);
      throw err;
    }
  },
};

module.exports = MealEntryRepository;
