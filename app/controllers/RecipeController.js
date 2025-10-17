const logger = require("../../config/logger");
const { RecipeRepository, HomeRepository, RecipeProductRepository, ProductRepository } = require("../repositories");
const { sequelize } = require('../models');
const { json } = require("sequelize");

const RecipeController = {
  async index(req, res) {
    try {
      const recipes = await RecipeRepository.findAll();
      if (!recipes.length) return res.status(204).json({ msg: "RecipesNotFound", recipes: [] });
      return res.status(200).json({ recipes });
    } catch (err) {
      logger.error("RecipeController->index: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async getByPersonId(req, res) {
    const { person_id: bodyPersonId } = req.body;
    const person_id = bodyPersonId || req.person?.id;
    try {
      const recipes = await RecipeRepository.findByPersonId(person_id);
      if (!recipes.length) return res.status(204).json({ msg: "RecipesNotFound", recipes: [] });

       const mappedRecipes = recipes.map(recipe => {
      const recipePlain = recipe.get({ plain: true });

      const products = recipe.recipeProducts.map(rp => {
        const warehouseItem = rp.product.homeWarehouseProducts[0] || null;

        return {
          recipe_product_id: rp.id, // 👈 ¡Aquí va el id de recipe_products!
          product_id: rp.product.id,
          person_home_warehouse_product_id: warehouseItem ? warehouseItem.id : null,
          name: rp.product.name,
          image: rp.product.image,
          quantity: rp.quantity,
          unit: rp.unit,
          calories_per_unit: rp.calories_per_unit,
          protein_per_unit: rp.protein_per_unit,
          carbs_per_unit: rp.carbs_per_unit,
          fats_per_unit: rp.fats_per_unit,
          fiber_per_unit: rp.fiber_per_unit,
          sugar_per_unit: rp.sugar_per_unit,
          saturated_fats_per_unit: rp.saturated_fats_per_unit,
          available_stock: warehouseItem ? warehouseItem.quantity : null
        };
      });

      const { home, recipeProducts, ...restOfRecipe } = recipePlain;

      return {
        ...restOfRecipe,
        products
      };
    });

      return res.status(200).json({ recipes: mappedRecipes });
    } catch (err) {
      logger.error("RecipeController->getByPersonId: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async show(req, res) {
    try {
      const recipe = await RecipeRepository.findById(req.body.id);
      if (!recipe) return res.status(204).json({ msg: "RecipeNotFound" });
      return res.status(200).json({ recipe });
    } catch (err) {
      logger.error("RecipeController->show: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  /*async store(req, res) {
    logger.info(`${req.user.name} - Crea receta`);
    logger.info("datos recibidos:");
    logger.info(JSON.stringify(req.body));

    const { person_id: bodyPersonId, products } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    req.body.person_id = person_id;
    // Verificar si la persona existe
    if (req.body.home_id) {
      // Verificar si el hogar existe
      const home = await HomeRepository.findById(req.body.home_id);
      if (!home) {
        logger.error(
          `RecipeController->create: Hogar no encontrado con ID ${req.body.home_id}`
        );
        return res.status(404).json({ msg: "HomeNotFound" });
      }
    }
    const t = await sequelize.transaction();
    try {
      const recipe = await RecipeRepository.create(req.body, req.file, t);

      let nutrients = {
        calories: recipe.calories || 0,
        protein: recipe.protein || 0,
        carbs: recipe.carbs || 0,
        fats: recipe.fats || 0,
        fiber: recipe.fiber || 0,
        sugar: recipe.sugar || 0,
        saturated_fats: recipe.saturated_fats || 0
      };

      // Procesar productos si existen
      if (products && Array.isArray(products) && products.length > 0) {
        const productIds = products.map(p => p.product_id);
        const dbProducts = await ProductRepository.findByIds(productIds);
        const foundIds = new Set(dbProducts.map(p => p.id));
        const missing = productIds.filter(id => !foundIds.has(id));
        
        if (missing.length > 0) {
          await t.rollback();
          return res.status(400).json({ msg: `Productos no encontrados: ${missing.join(', ')}` });
        }

        nutrients = await RecipeProductRepository.upsertForRecipe(recipe, products, t);
        await recipe.update(nutrients, { transaction: t });
      }

    await t.commit();
    const fullRecipe = await RecipeRepository.findById(recipe.id);
    res.status(201).json({ recipe: fullRecipe });
    } catch (err) {
      await t.rollback();
      logger.error("RecipeController->store: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },*/
  async store(req, res) {
    logger.info(`${req.user.name} - Crea receta`);
    logger.info("datos recibidos:");
    logger.info(JSON.stringify(req.body));

    const { person_id: bodyPersonId, products } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    // ✅ Eliminar los campos nutricionales del body si hay productos
    // para forzar el cálculo desde los ingredientes
    const recipeData = { ...req.body };
    recipeData.person_id = person_id;

    // Si hay productos, ignoramos los nutrientes enviados y los calcularemos
    if (products && Array.isArray(products) && products.length > 0) {
      // Eliminar campos nutricionales del body para evitar conflictos
      delete recipeData.calories;
      delete recipeData.protein;
      delete recipeData.carbs;
      delete recipeData.fats;
      delete recipeData.fiber;
      delete recipeData.sugar;
      delete recipeData.saturated_fats;
    }

    if (recipeData.home_id) {
      const home = await HomeRepository.findById(recipeData.home_id);
      if (!home) {
        logger.error(`RecipeController->create: Hogar no encontrado con ID ${recipeData.home_id}`);
        return res.status(404).json({ msg: "HomeNotFound" });
      }
    }

    const t = await sequelize.transaction();
    try {
      // Crear la receta SIN los nutrientes si hay productos
      const recipe = await RecipeRepository.create(recipeData, req.file, t);

      let nutrients = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
        sugar: 0,
        saturated_fats: 0
      };

      // ✅ Procesar productos y calcular nutrientes
      if (products && Array.isArray(products) && products.length > 0) {
        const productIds = products.map(p => Number(p.product_id));
        const dbProducts = await ProductRepository.findByIds(productIds);
        const foundIds = new Set(dbProducts.map(p => p.id));
        const missing = productIds.filter(id => !foundIds.has(id));

        if (missing.length > 0) {
          await t.rollback();
          return res.status(400).json({ msg: `Productos no encontrados: ${missing.join(', ')}` });
        }

        // 👇 Este método debe devolver los nutrientes TOTALES calculados
        nutrients = await RecipeProductRepository.upsertForRecipe(recipe, products, t);
      } else {
        // Si NO hay productos, usar los valores del body (si existen)
        nutrients = {
          calories: req.body.calories || 0,
          protein: req.body.protein || 0,
          carbs: req.body.carbs || 0,
          fats: req.body.fats || 0,
          fiber: req.body.fiber || 0,
          sugar: req.body.sugar || 0,
          saturated_fats: req.body.saturated_fats || 0
        };
      }

      // Actualizar la receta con los nutrientes calculados
      await recipe.update(nutrients, { transaction: t });

      await t.commit();
      const fullRecipe = await RecipeRepository.findById(recipe.id);
      res.status(201).json({ recipe: fullRecipe });
    } catch (err) {
      await t.rollback();
      logger.error("RecipeController->store: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },
  async update(req, res) {
  logger.info(`${req.user?.name || 'Anonymous'} - Edita una receta con ID ${req.body.id}`);
  logger.info("datos recibidos:");
  logger.info(JSON.stringify(req.body));

  try {
    const recipe = await RecipeRepository.findById(req.body.id);
    if (!recipe) return res.status(404).json({ msg: "RecipeNotFound" });

    const { products, ...otherFields } = req.body;
    const hasProductsField = 'products' in req.body; // 👈 Verifica si se envió explícitamente

    const t = await sequelize.transaction();
    try {
      let nutrientsToUpdate = {};

      if (hasProductsField) {
        if (Array.isArray(products) && products.length > 0) {
          const productIds = products.map(p => Number(p.product_id));
          const dbProducts = await ProductRepository.findByIds(productIds);
          const foundIds = new Set(dbProducts.map(p => p.id));
          const missing = productIds.filter(id => !foundIds.has(id));
          
          if (missing.length > 0) {
            await t.rollback();
            return res.status(400).json({ msg: `Productos no encontrados: ${missing.join(', ')}` });
          }

          nutrientsToUpdate = await RecipeProductRepository.upsertForRecipe(recipe, products, t);
        }
      }

      // Combinar: otros campos + nutrientes calculados (si aplica)
      const updateData = { ...otherFields, ...nutrientsToUpdate };

      // Una sola actualización
      const updated = await RecipeRepository.update(recipe, updateData, req.file, t);
      
      await t.commit();
      res.status(200).json({ message: 'Receta Actualizada correctamente', recipe: updated });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    logger.error("RecipeController->update: " + err.message);
    res.status(500).json({ error: "ServerError", details: err.message });
  }
},

  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina la receta con ID ${req.body.id}`);
    try {
      const recipe = await RecipeRepository.findById(req.body.id);
      if (!recipe) return res.status(404).json({ msg: "RecipeNotFound" });
      await RecipeRepository.delete(recipe);
      res.status(200).json({ msg: "RecipeDeleted" });
    } catch (err) {
      logger.error("RecipeController->destroy: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  }
};

module.exports = RecipeController;