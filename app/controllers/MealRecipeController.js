const logger = require("../../config/logger");
const { MealRecipeRepository, MealEntryRepository } = require("../repositories");
const { sequelize } = require('../models');

const MealRecipeController = {
  async getByMealEntryId(req, res) {
    const { meal_entry_id } = req.body;
    if (!meal_entry_id) return res.status(400).json({ msg: "MealEntryIdRequired" });
    
    try {
      const items = await MealRecipeRepository.findByMealEntryId(meal_entry_id);
      if (!items.length) return res.status(204).json({ msg: "MealRecipesNotFound", items: [] });
      return res.status(200).json({ recipes: items });
    } catch (err) {
      logger.error("MealRecipeController->getByMealEntryId: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async show(req, res) {
    try {
      const item = await MealRecipeRepository.findById(req.body.id);
      if (!item) return res.status(204).json({ msg: "MealRecipeNotFound" });
      return res.status(200).json({ recipe: item });
    } catch (err) {
      logger.error("MealRecipeController->show: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async store(req, res) {
    const { meal_entry_id } = req.body;
    
    const mealEntry = await MealEntryRepository.findById(meal_entry_id);
    if (!mealEntry) {
      return res.status(404).json({ msg: "MealEntryNotFound" });
    }

    const t = await sequelize.transaction();
    try {
      const item = await MealRecipeRepository.create(req.body, t);
      await t.commit();
      res.status(201).json({ recipe: item });
    } catch (err) {
      await t.rollback();
      logger.error("MealRecipeController->store: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async update(req, res) {
    try {
      const item = await MealRecipeRepository.findById(req.body.id);
      if (!item) return res.status(404).json({ msg: "MealRecipeNotFound" });

      const t = await sequelize.transaction();
      try {
        const updated = await MealRecipeRepository.update(item, req.body, t);
        await t.commit();
        res.status(200).json({ recipe: updated });
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (err) {
      logger.error("MealRecipeController->update: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async destroy(req, res) {
    try {
      const item = await MealRecipeRepository.findById(req.body.id);
      if (!item) return res.status(404).json({ msg: "MealRecipeNotFound" });
      
      await MealRecipeRepository.delete(item);
      res.status(200).json({ msg: "MealRecipeDeleted" });
    } catch (err) {
      logger.error("MealRecipeController->destroy: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  }
};

module.exports = MealRecipeController;