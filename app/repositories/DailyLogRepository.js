const {
  DailyLog,
  Person,
  MealEntry,
  Type,
  MealRecipe,
  Recipe,
} = require("../models");
const logger = require("../../config/logger");
const { Op } = require("sequelize");

const DailyLogRepository = {
  async findAll() {
    return await DailyLog.findAll({
      attributes: [
        "id",
        "person_id",
        "date",
        "water_intake",
        "sleep_hours",
        "steps",
        "notes",
      ],
      include: [
        { model: Person, as: "person" },
        {
          model: MealEntry,
          as: "mealEntries",
          include: [
            { model: Type, as: "type" },
            {
              model: MealRecipe,
              as: "mealRecipes",
              include: [{ model: Recipe, as: "recipe" }],
            },
          ],
        },
      ],
      order: [["date", "DESC"]],
    });
  },

  async findByPersonId(person_id) {
    return await DailyLog.findAll({
      where: { person_id },
      attributes: [
        "id",
        "person_id",
        "date",
        "water_intake",
        "sleep_hours",
        "steps",
        "notes",
      ],
      include: [
        { model: Person, as: "person" },
        {
          model: MealEntry,
          as: "mealEntries",
          include: [
            { model: Type, as: "type" },
            {
              model: MealRecipe,
              as: "mealRecipes",
              include: [{ model: Recipe, as: "recipe" }],
            },
          ],
        },
      ],
      order: [["date", "DESC"]],
    });
  },

  getCurrentMonthRange() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Mes de 01 a 12

    const startDate = `${year}-${month}-01`;

    // Último día del mes
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
    return { startDate, endDate };
  },

  async findByPersonIdAndDate(person_id, date = null) {
    // 1. Construir condiciones base
    const whereCondition = {
      person_id,
    };

    // 2. Añadir condición de fecha según el caso
    if (date) {
      // Fecha específica
      whereCondition.date = date;
    } else {
      // Mes actual
      const { startDate, endDate } = this.getCurrentMonthRange();
      whereCondition.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    // 3. Ejecutar UNA SOLA consulta
    return await DailyLog.findAll({
      where: whereCondition,
      attributes: [
        "id",
        "person_id",
        "date",
        "water_intake",
        "sleep_hours",
        "steps",
        "notes",
      ],
      include: [
        { model: Person, as: "person" },
        {
          model: MealEntry,
          as: "mealEntries",
          include: [
            { model: Type, as: "type" },
            {
              model: MealRecipe,
              as: "mealRecipes",
              include: [{ model: Recipe, as: "recipe" }],
            },
          ],
        },
      ],
      order: [["date", "DESC"]],
    });
  },

  async findByPersonIdAndToday(person_id, date) {
    return await DailyLog.findOne({
      where: { person_id, date },
      attributes: [
        "id",
        "person_id",
        "date",
        "water_intake",
        "sleep_hours",
        "steps",
        "notes",
      ],
      include: [{ model: Person, as: "person" }],
    });
  },

  async findById(id) {
    return await DailyLog.findByPk(id, {
      attributes: [
        "id",
        "person_id",
        "date",
        "water_intake",
        "sleep_hours",
        "steps",
        "notes",
      ],
      include: [
        { model: Person, as: "person" },
        {
          model: MealEntry,
          as: "mealEntries",
          include: [
            { model: Type, as: "type" },
            {
              model: MealRecipe,
              as: "mealRecipes",
              include: [{ model: Recipe, as: "recipe" }],
            },
          ],
        },
      ],
    });
  },

  async findOne(options) {
    return await DailyLog.findOne(options);
  },

  async create(body, t) {
    logger.info('creando registro diario');
    logger.info(JSON.stringify(body));
    try {
      const newLog = await DailyLog.create(
        {
          person_id: body.person_id,
          date: body.date,
          water_intake: body.water_intake || null,
          sleep_hours: body.sleep_hours || null,
          steps: body.steps || null,
          notes: body.notes || null,
        },
        { transaction: t }
      );
      logger.info(
        `Registro diario creado para person_id: ${body.person_id}, fecha: ${body.date}`
      );
      return newLog;
    } catch (err) {
      logger.error(`Error en DailyLogRepository->create: ${err.message}`);
      throw err;
    }
  },

  async countByDailyLogId(daily_log_id, transaction = null){
    const options = { where: { daily_log_id } };
    if (transaction) options.transaction = transaction;
    return MealEntry.count(options);
  },

  async update(logRecord, body, t) {
    const fieldsToUpdate = ["water_intake", "sleep_hours", "steps", "notes", "date"];
    const updatedData = {};

    Object.keys(body).forEach((key) => {
      if (fieldsToUpdate.includes(key) && body[key] !== undefined) {
        updatedData[key] = body[key];
      }
    });

    try {
      if (Object.keys(updatedData).length > 0) {
        await logRecord.update(updatedData, { transaction: t });
        logger.info(`Registro diario actualizado (ID: ${logRecord.id})`);
      }
      return logRecord;
    } catch (err) {
      logger.error(`Error en DailyLogRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(logRecord, t = null) {
    try {
      await logRecord.destroy({transaction: t});
      return true;
    } catch (err) {
      logger.error(`Error en DailyLogRepository->delete: ${err.message}`);
      throw err;
    }
  },
};

module.exports = DailyLogRepository;
