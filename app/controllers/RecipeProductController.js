const logger = require("../../config/logger");
const { RecipeProductRepository, RecipeRepository, ProductRepository } = require("../repositories");
const { sequelize } = require('../models');

const RecipeProductController = {
  async getByRecipeId(req, res) {
    const { recipe_id } = req.body;


    if (!recipe_id) return res.status(400).json({ msg: "RecipeIdRequired" });
    try {
      const items = await RecipeProductRepository.findByRecipeId(recipe_id);
      if (!items.length) return res.status(204).json({ msg: "RecipeProductsNotFound", items: [] });
      return res.status(200).json({ ingredients: items });
    } catch (err) {
      logger.error("RecipeProductController->getByRecipeId: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async show(req, res) {
    try {
      const item = await RecipeProductRepository.findById(req.body.id);
      if (!item) return res.status(204).json({ msg: "RecipeProductNotFound" });
      return res.status(200).json({ ingredient: item });
    } catch (err) {
      logger.error("RecipeProductController->show: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async store(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Agrega ingrediente a receta`);
    logger.info("Datos recibidos:");
    logger.info(JSON.stringify(req.body));

    const { recipe_id, product_id } = req.body;

    // Verificar que la receta exista
    const recipe = await RecipeRepository.findById(recipe_id);
    if (!recipe) {
      logger.error(`Receta no encontrada con ID ${recipe_id}`);
      return res.status(404).json({ msg: "RecipeNotFound" });
    }

    // Verificar que el producto exista
    const product = await ProductRepository.findById(product_id);
    if (!product) {
      logger.error(`Producto no encontrado con ID ${product_id}`);
      return res.status(404).json({ msg: "ProductNotFound" });
    }

    const t = await sequelize.transaction();
    try {
      const item = await RecipeProductRepository.create(req.body, t);
      await t.commit();
      res.status(201).json({ ingredient: item });
    } catch (err) {
      await t.rollback();
      logger.error("RecipeProductController->store: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async update(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Edita ingrediente con ID ${req.body.id}`);
    logger.info("Datos recibidos:");
    logger.info(JSON.stringify(req.body));

    try {
      const item = await RecipeProductRepository.findById(req.body.id);
      if (!item) return res.status(404).json({ msg: "RecipeProductNotFound" });

      const t = await sequelize.transaction();
      try {
        const updated = await RecipeProductRepository.update(item, req.body, t);
        await t.commit();
        res.status(200).json({ ingredient: updated });
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (err) {
      logger.error("RecipeProductController->update: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async destroy(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Elimina ingrediente con ID ${req.body.id}`);
    try {
      const item = await RecipeProductRepository.findById(req.body.id);
      if (!item) return res.status(404).json({ msg: "RecipeProductNotFound" });
      await RecipeProductRepository.delete(item);
      res.status(200).json({ msg: "RecipeProductDeleted" });
    } catch (err) {
      logger.error("RecipeProductController->destroy: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  }
};

module.exports = RecipeProductController;