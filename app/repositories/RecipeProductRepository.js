const { RecipeProduct, Recipe, Product } = require("../models");
const logger = require("../../config/logger");

const RecipeProductRepository = {
  async findByRecipeId(recipe_id) {
    return await RecipeProduct.findAll({
      where: { recipe_id },
      attributes: [
        "id", "recipe_id", "person_id", "product_id", "quantity", "unit",
        "calories_per_unit", "protein_per_unit", "carbs_per_unit",
        "fats_per_unit", "fiber_per_unit", "sugar_per_unit", "saturated_fats_per_unit"
      ],
      include: [
        { model: Product, as: "product", attributes: ["id", "name"] }
      ],
      order: [["id", "ASC"]]
    });
  },

  async findById(id) {
    return await RecipeProduct.findByPk(id, {
      attributes: [
        "id", "recipe_id", "person_id", "product_id", "quantity", "unit",
        "calories_per_unit", "protein_per_unit", "carbs_per_unit",
        "fats_per_unit", "fiber_per_unit", "sugar_per_unit", "saturated_fats_per_unit"
      ],
      include: [
        { model: Recipe, as: "recipe", attributes: ["id", "name"] },
        { model: Product, as: "product", attributes: ["id", "name"] }
      ]
    });
  },

  async create(body, t) {
    try {
      const item = await RecipeProduct.create({
        recipe_id: body.recipe_id,
        person_id: body.person_id,
        product_id: body.product_id,
        quantity: body.quantity,
        unit: body.unit,
        calories_per_unit: body.calories_per_unit || null,
        protein_per_unit: body.protein_per_unit || null,
        carbs_per_unit: body.carbs_per_unit || null,
        fats_per_unit: body.fats_per_unit || null,
        fiber_per_unit: body.fiber_per_unit || null,
        sugar_per_unit: body.sugar_per_unit || null,
        saturated_fats_per_unit: body.saturated_fats_per_unit || null
      }, { transaction: t });
      logger.info(`Ingrediente agregado a receta ${body.recipe_id}: producto ${body.product_id}`);
      return item;
    } catch (err) {
      logger.error(`Error en RecipeProductRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(itemRecord, body, t) {
    const fields = [
      "quantity", "unit", "calories_per_unit", "protein_per_unit", "carbs_per_unit",
      "fats_per_unit", "fiber_per_unit", "sugar_per_unit", "saturated_fats_per_unit"
    ];
    const data = {};
    fields.forEach(f => {
      if (body[f] !== undefined) data[f] = body[f];
    });
    try {
      if (Object.keys(data).length > 0) {
        await itemRecord.update(data, { transaction: t });
        logger.info(`Ingrediente actualizado (ID: ${itemRecord.id})`);
      }
      return itemRecord;
    } catch (err) {
      logger.error(`Error en RecipeProductRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(itemRecord) {
    try {
      await itemRecord.destroy();
      logger.info(`Ingrediente eliminado de receta (ID: ${itemRecord.id})`);
      return true;
    } catch (err) {
      logger.error(`Error en RecipeProductRepository->delete: ${err.message}`);
      throw err;
    }
  },

  // Dentro de RecipeProductRepository
/*async upsertForRecipe(recipe, products, t) {
  try {
    const recipe_id = recipe.id;
    const person_id = recipe.person_id;
    // 1. Obtener asociaciones actuales
    const currentAssociations = await RecipeProduct.findAll({
      where: { recipe_id },
      transaction: t
    });
    const currentProductIds = new Set(currentAssociations.map(a => a.product_id));

    // 2. IDs de los productos nuevos
    const newProductIds = new Set(products.map(p => p.product_id));

    // 3. Eliminar asociaciones que ya no están
    const toDelete = currentAssociations.filter(a => !newProductIds.has(a.product_id));
    if (toDelete.length > 0) {
      await RecipeProduct.destroy({
        where: {
          id: toDelete.map(a => a.id)
        },
        transaction: t
      });
    }

    // 4. Actualizar o crear nuevas asociaciones
    for (const prod of products) {
      const existing = currentAssociations.find(a => a.product_id === prod.product_id);
      if (existing) {
        // Actualizar
        await existing.update({
          quantity: prod.quantity,
          unit: prod.unit,
          calories_per_unit: prod.calories_per_unit || null,
          protein_per_unit: prod.protein_per_unit || null,
          carbs_per_unit: prod.carbs_per_unit || null,
          fats_per_unit: prod.fats_per_unit || null,
          fiber_per_unit: prod.fiber_per_unit || null,
          sugar_per_unit: prod.sugar_per_unit || null,
          saturated_fats_per_unit: prod.saturated_fats_per_unit || null
        }, { transaction: t });
      } else {
        // Crear
        await RecipeProduct.create({
          recipe_id,
          person_id,
          product_id: prod.product_id,
          quantity: prod.quantity,
          unit: prod.unit,
          calories_per_unit: prod.calories_per_unit || null,
          protein_per_unit: prod.protein_per_unit || null,
          carbs_per_unit: prod.carbs_per_unit || null,
          fats_per_unit: prod.fats_per_unit || null,
          fiber_per_unit: prod.fiber_per_unit || null,
          sugar_per_unit: prod.sugar_per_unit || null,
          saturated_fats_per_unit: prod.saturated_fats_per_unit || null
        }, { transaction: t });
      }
    }

    // 5. Recalcular nutrientes totales de la receta
    const allAssociations = await RecipeProduct.findAll({
      where: { recipe_id },
      transaction: t
    });

    let totalCal = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0,
        totalFiber = 0, totalSugar = 0, totalSatFats = 0;

    allAssociations.forEach(item => {
      const qty = parseFloat(item.quantity);
      totalCal += (item.calories_per_unit || 0) * qty;
      totalProtein += (item.protein_per_unit || 0) * qty;
      totalCarbs += (item.carbs_per_unit || 0) * qty;
      totalFats += (item.fats_per_unit || 0) * qty;
      totalFiber += (item.fiber_per_unit || 0) * qty;
      totalSugar += (item.sugar_per_unit || 0) * qty;
      totalSatFats += (item.saturated_fats_per_unit || 0) * qty;
    });

    return {
      calories: Math.round(totalCal),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fats: Math.round(totalFats),
      fiber: Math.round(totalFiber),
      sugar: Math.round(totalSugar),
      saturated_fats: Math.round(totalSatFats)
    };
  } catch (err) {
    logger.error(`Error en RecipeProductRepository->upsertForRecipe: ${err.message}`);
    throw err;
  }
}*/
async upsertForRecipe(recipe, products, t) {
  try {
    const recipe_id = recipe.id;
    const person_id = recipe.person_id;

    // 1. Obtener asociaciones actuales
    const currentAssociations = await RecipeProduct.findAll({
      where: { recipe_id },
      transaction: t
    });
    const currentProductIds = new Set(currentAssociations.map(a => a.product_id));

    // 2. IDs de los productos nuevos
    const newProductIds = new Set(products.map(p => p.product_id));

    // 3. Eliminar asociaciones que ya no están
    const toDelete = currentAssociations.filter(a => !newProductIds.has(a.product_id));
    if (toDelete.length > 0) {
      await RecipeProduct.destroy({
        where: {
          id: toDelete.map(a => a.id)
        },
        transaction: t
      });
    }

    // 4. Actualizar o crear nuevas asociaciones
    for (const prod of products) {
      const existing = currentAssociations.find(a => a.product_id === prod.product_id);
      const quantity = parseFloat(prod.quantity); // ✅ Asegurar número

      if (existing) {
        await existing.update({
          quantity,
          unit: prod.unit,
          calories_per_unit: prod.calories_per_unit != null ? parseFloat(prod.calories_per_unit) : null,
          protein_per_unit: prod.protein_per_unit != null ? parseFloat(prod.protein_per_unit) : null,
          carbs_per_unit: prod.carbs_per_unit != null ? parseFloat(prod.carbs_per_unit) : null,
          fats_per_unit: prod.fats_per_unit != null ? parseFloat(prod.fats_per_unit) : null,
          fiber_per_unit: prod.fiber_per_unit != null ? parseFloat(prod.fiber_per_unit) : null,
          sugar_per_unit: prod.sugar_per_unit != null ? parseFloat(prod.sugar_per_unit) : null,
          saturated_fats_per_unit: prod.saturated_fats_per_unit != null ? parseFloat(prod.saturated_fats_per_unit) : null
        }, { transaction: t });
      } else {
        await RecipeProduct.create({
          recipe_id,
          person_id,
          product_id: prod.product_id,
          quantity,
          unit: prod.unit,
          calories_per_unit: prod.calories_per_unit != null ? parseFloat(prod.calories_per_unit) : null,
          protein_per_unit: prod.protein_per_unit != null ? parseFloat(prod.protein_per_unit) : null,
          carbs_per_unit: prod.carbs_per_unit != null ? parseFloat(prod.carbs_per_unit) : null,
          fats_per_unit: prod.fats_per_unit != null ? parseFloat(prod.fats_per_unit) : null,
          fiber_per_unit: prod.fiber_per_unit != null ? parseFloat(prod.fiber_per_unit) : null,
          sugar_per_unit: prod.sugar_per_unit != null ? parseFloat(prod.sugar_per_unit) : null,
          saturated_fats_per_unit: prod.saturated_fats_per_unit != null ? parseFloat(prod.saturated_fats_per_unit) : null
        }, { transaction: t });
      }
    }

    // 5. Recalcular nutrientes totales desde la BD (fuente de verdad)
    const allAssociations = await RecipeProduct.findAll({
      where: { recipe_id },
      transaction: t
    });

    let totalCal = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0,
        totalFiber = 0, totalSugar = 0, totalSatFats = 0;

    allAssociations.forEach(item => {
      const qty = parseFloat(item.quantity);
      totalCal += (item.calories_per_unit || 0) * qty;
      totalProtein += (item.protein_per_unit || 0) * qty;
      totalCarbs += (item.carbs_per_unit || 0) * qty;
      totalFats += (item.fats_per_unit || 0) * qty;
      totalFiber += (item.fiber_per_unit || 0) * qty;
      totalSugar += (item.sugar_per_unit || 0) * qty;
      totalSatFats += (item.saturated_fats_per_unit || 0) * qty;
    });

    return {
      calories: Math.round(totalCal),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fats: Math.round(totalFats),
      fiber: Math.round(totalFiber),
      sugar: Math.round(totalSugar),
      saturated_fats: Math.round(totalSatFats)
    };
  } catch (err) {
    logger.error(`Error en RecipeProductRepository->upsertForRecipe: ${err.message}`);
    throw err;
  }
}
};

module.exports = RecipeProductRepository;