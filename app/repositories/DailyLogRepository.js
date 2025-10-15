const { DailyLog, Person } = require("../models");
const logger = require("../../config/logger");

const DailyLogRepository = {
  async findAll() {
    return await DailyLog.findAll({
      attributes: [
        "id", "person_id", "date", "water_intake", "sleep_hours", "steps", "notes"
      ],
      include: [{ model: Person, as: "person" }],
      order: [["date", "DESC"]]
    });
  },

  async findByPersonId(person_id) {
    return await DailyLog.findAll({
      where: { person_id },
      attributes: ["id", "person_id", "date", "water_intake", "sleep_hours", "steps", "notes"],
      include: [{ model: Person, as: "person" }],
      order: [["date", "DESC"]]
    });
  },

  async findByPersonIdAndDate(person_id, date) {
    return await DailyLog.findOne({
      where: { person_id, date },
      attributes: ["id", "person_id", "date", "water_intake", "sleep_hours", "steps", "notes"],
      include: [{ model: Person, as: "person" }]
    });
  },

  async findById(id) {
    return await DailyLog.findByPk(id, {
      attributes: ["id", "person_id", "date", "water_intake", "sleep_hours", "steps", "notes"],
      include: [{ model: Person, as: "person" }]
    });
  },

  async create(body, t) {
    try {
      const newLog = await DailyLog.create(
        {
          person_id: body.person_id,
          date: body.date,
          water_intake: body.water_intake || null,
          sleep_hours: body.sleep_hours || null,
          steps: body.steps || null,
          notes: body.notes || null
        },
        { transaction: t }
      );
      logger.info(`Registro diario creado para person_id: ${body.person_id}, fecha: ${body.date}`);
      return newLog;
    } catch (err) {
      logger.error(`Error en DailyLogRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(logRecord, body, t) {
    const fieldsToUpdate = ["water_intake", "sleep_hours", "steps", "notes"];
    const updatedData = {};

    Object.keys(body).forEach(key => {
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

  async delete(logRecord) {
    try {
      await logRecord.destroy();
      logger.info(`Registro diario eliminado (ID: ${logRecord.id})`);
      return true;
    } catch (err) {
      logger.error(`Error en DailyLogRepository->delete: ${err.message}`);
      throw err;
    }
  }
};

module.exports = DailyLogRepository;