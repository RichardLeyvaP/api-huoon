const logger = require("../../config/logger");
const { DailyLogRepository } = require("../repositories");
const { sequelize } = require("../models")

const DailyLogController = {
  async index(req, res) {
    try {
      const logs = await DailyLogRepository.findAll();
      if (!logs.length) return res.status(204).json({ msg: "DailyLogsNotFound", logs: [] });

      const mapped = logs.map(l => ({
        id: l.id,
        personId: l.person_id,
        date: l.date,
        waterIntake: l.water_intake,
        sleepHours: l.sleep_hours,
        steps: l.steps,
        notes: l.notes,
        person: l.person ? { id: l.person.id, name: l.person.name } : null
      }));

      res.status(200).json({ logs: mapped });
    } catch (err) {
      logger.error("DailyLogController->index: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async getByPersonId(req, res) {
    const { person_id } = req.body;
    if (!person_id) return res.status(400).json({ msg: "PersonIdRequired" });

    try {
      const logs = await DailyLogRepository.findByPersonId(person_id);
      if (!logs.length) return res.status(204).json({ msg: "DailyLogsNotFound", logs: [] });

      const mapped = logs.map(l => ({
        id: l.id,
        date: l.date,
        waterIntake: l.water_intake,
        water_intake: l.water_intake,
        sleepHours: l.sleep_hours,
        sleep_hours: l.sleep_hours,
        steps: l.steps,
        notes: l.notes,
        meal_tries: log.mealEntries
      }));

      res.status(200).json({ logs: mapped });
    } catch (err) {
      logger.error("DailyLogController->getByPersonId: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async getByPersonIdAndDate(req, res) {
    logger.info(`${req.user.name} - Busca los registros diarios en nutrición`);
    const { person_id: bodyPersonId, date } = req.body;
    const person_id = bodyPersonId || req.person?.id;
    try {
      const logs = await DailyLogRepository.findByPersonIdAndDate(person_id, date);
      if (!logs.length) return res.status(204).json({ msg: "DailyLogNotFound" });

      const mapped = logs.map(log => ({
        id: log.id,
        personId: log.person_id,
        person_id: log.person_id,
        date: log.date,
        waterIntake: log.water_intake,
        water_intake: log.water_intake,
        sleepHours: log.sleep_hours,
        sleep_hours: log.sleep_hours,
        steps: log.steps,
        notes: log.notes,
        meal_entries: log.mealEntries
      }));

      res.status(200).json({ dailylogs: mapped });
    } catch (err) {
      logger.error("DailyLogController->getByPersonIdAndDate: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async show(req, res) {
    try {
      const log = await DailyLogRepository.findById(req.body.id);
      if (!log) return res.status(204).json({ msg: "DailyLogNotFound" });

      const mapped = {
        id: log.id,
        personId: log.person_id,
        date: log.date,
        waterIntake: log.water_intake,
        sleepHours: log.sleep_hours,
        steps: log.steps,
        notes: log.notes,
        person: log.person ? { id: log.person.id, name: log.person.name } : null
      };

      res.status(200).json({ log: mapped });
    } catch (err) {
      logger.error("DailyLogController->show: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async store(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Creating new daily log`);
    logger.info("Received data:");
    logger.info(JSON.stringify(req.body));

    const { person_id: bodyPersonId } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    req.body.person_id = person_id;

    const t = await sequelize.transaction();
    try {

      const log = await DailyLogRepository.create(req.body, t);
      await t.commit();
      res.status(201).json({ dailyLog: log, message: "Registro creado Correctamente" });
    } catch (err) {
      await t.rollback();
      logger.error("DailyLogController->store: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async update(req, res) {
     logger.info(`${req.user?.name || 'Anonymous'} - Edit daily log`);
    logger.info("Received data:");
    logger.info(JSON.stringify(req.body));
    try {
      const log = await DailyLogRepository.findById(req.body.id);
      if (!log) return res.status(404).json({ msg: "DailyLogNotFound" });

      const t = await sequelize.transaction();
      try {
        const updated = await DailyLogRepository.update(log, req.body, t);
        await t.commit();
        res.status(200).json({ dailyLog: updated, message: "Registro actualizado Correctamente" });
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (err) {
      logger.error("DailyLogController->update: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async destroy(req, res) {
    try {
      const log = await DailyLogRepository.findById(req.body.id);
      if (!log) return res.status(404).json({ msg: "DailyLogNotFound" });

      await DailyLogRepository.delete(log);
      res.status(200).json({ msg: "DailyLogDeleted" });
    } catch (err) {
      logger.error("DailyLogController->destroy: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  }
};

module.exports = DailyLogController;