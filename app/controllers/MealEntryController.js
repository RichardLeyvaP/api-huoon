const logger = require("../../config/logger");
const { MealEntryRepository, DailyLogRepository } = require("../repositories");
const { sequelize } = require('../models');

const MealEntryController = {
  async index(req, res) {
    try {
      const meals = await MealEntryRepository.findAll();
      if (!meals.length) return res.status(204).json({ msg: "MealEntriesNotFound", meals: [] });
      return res.status(200).json({ meals });
    } catch (err) {
      logger.error("MealEntryController->index: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async getByDailyLogId(req, res) {
    const { daily_log_id } = req.body;
    if (!daily_log_id) return res.status(400).json({ msg: "DailyLogIdRequired" });
    
    try {
      const meals = await MealEntryRepository.findByDailyLogId(daily_log_id);
      return res.status(200).json({ meals });
    } catch (err) {
      logger.error("MealEntryController->getByDailyLogId: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async show(req, res) {
    try {
      const meal = await MealEntryRepository.findById(req.body.id);
      if (!meal) return res.status(204).json({ msg: "MealEntryNotFound" });
      return res.status(200).json({ meal });
    } catch (err) {
      logger.error("MealEntryController->show: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async store(req, res) {
    const { daily_log_id } = req.body;
    
    const dailyLog = await DailyLogRepository.findById(daily_log_id);
    if (!dailyLog) {
      return res.status(404).json({ msg: "DailyLogNotFound" });
    }

    const t = await sequelize.transaction();
    try {
      const meal = await MealEntryRepository.create(req.body, t);
      await t.commit();
      res.status(201).json({ meal });
    } catch (err) {
      await t.rollback();
      logger.error("MealEntryController->store: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async update(req, res) {
    try {
      const meal = await MealEntryRepository.findById(req.body.id);
      if (!meal) return res.status(404).json({ msg: "MealEntryNotFound" });

      const t = await sequelize.transaction();
      try {
        const updated = await MealEntryRepository.update(meal, req.body, t);
        await t.commit();
        res.status(200).json({ meal: updated });
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (err) {
      logger.error("MealEntryController->update: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async destroy(req, res) {
    try {
      const meal = await MealEntryRepository.findById(req.body.id);
      if (!meal) return res.status(404).json({ msg: "MealEntryNotFound" });
      
      await MealEntryRepository.delete(meal);
      res.status(200).json({ msg: "MealEntryDeleted" });
    } catch (err) {
      logger.error("MealEntryController->destroy: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  }
};

module.exports = MealEntryController;