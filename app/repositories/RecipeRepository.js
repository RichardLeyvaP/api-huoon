const { Recipe, Person, Home, RecipeProduct, PersonHomeWarehouseProduct, Product } = require("../models");
const logger = require("../../config/logger");
const { ImageService } = require("../services/ImageService");

const RecipeRepository = {
  async findAll() {
    return await Recipe.findAll({
      attributes: [
        "id", "person_id", "home_id", "name", "description", "is_favorite", "image",
        "preparation_time", "servings", "calories", "protein", "carbs", "fats",
        "fiber", "sugar", "saturated_fats", "is_private"
      ],
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" }
      ],
      order: [["createdAt", "DESC"]]
    });
  },

  async findByPersonId(person_id) {
    return await Recipe.findAll({
      where: { person_id },
      attributes: [
        "id", "home_id", "name", "description", "is_favorite", "image",
        "preparation_time", "servings", "calories", "protein", "carbs", "fats",
        "fiber", "sugar", "saturated_fats", "is_private"
      ],
      include: [
        {
          model: Home,
          as: "home"
        },
        {
          model: RecipeProduct,
          as: "recipeProducts",
          attributes: [
            "id", "quantity", "unit", "calories_per_unit", "protein_per_unit",
            "carbs_per_unit", "fats_per_unit", "fiber_per_unit",
            "sugar_per_unit", "saturated_fats_per_unit"
          ],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image"],
              include: [
                {
                  model: PersonHomeWarehouseProduct,
                  as: "homeWarehouseProducts",
                  where: { person_id }, // ¡Filtrar por la misma persona!
                  attributes: ["id", "quantity"], // Solo la cantidad del inventario personal
                  required: false // left join: si no hay stock, igual muestra el producto
                }
              ]
            }
          ]
        }
      ],
      order: [["name", "ASC"]]
    });
  },

  async findById(id) {
    return await Recipe.findByPk(id, {
      attributes: [
        "id", "person_id", "home_id", "name", "description", "is_favorite", "image",
        "preparation_time", "servings", "calories", "protein", "carbs", "fats",
        "fiber", "sugar", "saturated_fats", "is_private"
      ],
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" }
      ]
    });
  },

  async create(body, file, t) {
    try {
      const recipe = await Recipe.create({
        person_id: body.person_id,
        home_id: body.home_id || null,
        name: body.name,
        description: body.description || null,
        is_favorite: body.is_favorite ?? false,
        image: "recipes/default.jpg",
        preparation_time: body.preparation_time || null,
        servings: body.servings,
        calories: body.calories || null,
        protein: body.protein || null,
        carbs: body.carbs || null,
        fats: body.fats || null,
        fiber: body.fiber || null,
        sugar: body.sugar || null,
        saturated_fats: body.saturated_fats || null,
        is_private: body.is_private ?? false
      }, { transaction: t });

        if (file) {
        const newFilename = ImageService.generateFilename(
          "recipes",
          recipe.id,
          file.originalname
        );
        recipe.image = await ImageService.moveFile(file, newFilename);
        await recipe.update(
          { image: recipe.image },
          { transaction: t }
        );
      }
      logger.info(`Receta creada: ${recipe.name} (ID: ${recipe.id})`);
      return recipe;
    } catch (err) {
      logger.error(`Error en RecipeRepository->create: ${err.message}`);
      throw err;
    }
  },

  async update(recipe, body, file, t) {
    const fields = [
      "home_id", "name", "description", "is_favorite", "image",
      "preparation_time", "servings", "calories", "protein", "carbs", "fats",
      "fiber", "sugar", "saturated_fats", "is_private"
    ];
    const data = {};
    fields.forEach(f => {
      if (body[f] !== undefined) data[f] = body[f];
    });
    try {
        if (file) {
        if (recipe.image && recipe.image !== "recipes/default.jpg") {
          await ImageService.deleteFile(recipe.image);
        }
        const newFilename = ImageService.generateFilename(
          "recipes",
          recipe.id,
          file.originalname
        );
        updatedData.image = await ImageService.moveFile(
          file,
          newFilename
        );
      }
      if (Object.keys(data).length > 0) {
        await recipe.update(data, { transaction: t });
        logger.info(`Receta actualizada (ID: ${recipe.id})`);
      }
      return recipe;
    } catch (err) {
      logger.error(`Error en RecipeRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(recipe) {
    try {
        if (recipe.image && recipe.image !== "recipes/default.jpg") {
         await ImageService.deleteFile(recipe.image);
        }
      await recipe.destroy();
      logger.info(`Receta eliminada (ID: ${recipe.id})`);
      return true;
    } catch (err) {
      logger.error(`Error en RecipeRepository->delete: ${err.message}`);
      throw err;
    }
  }
};

module.exports = RecipeRepository;