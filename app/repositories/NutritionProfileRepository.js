const {
  NutritionProfile,
  Person,
  Home,
  DailyLog,
  MealEntry,
  MealRecipe,
  Recipe,
  Type,
} = require("../models");
const logger = require("../../config/logger");

const NutritionProfileRepository = {
  async findAll() {
    return await NutritionProfile.findAll({
      attributes: [
        "id",
        "person_id",
        "calories",
        "protein",
        "carbs",
        "fats",
        "fiber",
        "sugar_limit",
        "sat_fats_limit",
        "water",
      ],
      include: [
        {
          model: Person,
          as: "person",
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  },

  async findByPersonId(person_id) {
    return await NutritionProfile.findOne({
      where: { person_id },
      attributes: [
        "id",
        "person_id",
        "calories",
        "protein",
        "carbs",
        "fats",
        "fiber",
        "sugar_limit",
        "sat_fats_limit",
        "water",
      ],
      include: [
        {
          model: Person,
          as: "person",
        },
      ],
    });
  },

  // NutritionProfileRepository.js

  async findRawNutritionDataByHomeId(homeId, date, personId = null) {
    try {
      const wherePerson = personId ? { id: personId } : {};

      return await Person.findAll({
        where: wherePerson,
        include: [
          {
            model: Home,
            as: "homePersons",
            where: { id: homeId },
            required: true,
          },
          {
            model: NutritionProfile,
            as: "nutritionProfile",
            required: false,
          },
          {
            model: DailyLog,
            as: "dailylogs",
            where: { date },
            required: false,
            include: [
              {
                model: MealEntry,
                as: "mealEntries",
                required: false,
                include: [
                  {
                    model: MealRecipe,
                    as: "mealRecipes",
                    required: false,
                    include: [{ model: Recipe, as: "recipe" }],
                  },
                  { model: Type, as: "type", required: false },
                ],
              },
            ],
          },
        ],
        order: [["name", "ASC"]],
      });
    } catch (error) {
      logger.error(
        "NutritionProfileRepository->findRawNutritionDataByHomeId:",
        error.message
      );
      throw error;
    }
  },


  async findById(id) {
    return await NutritionProfile.findByPk(id, {
      attributes: [
        "id",
        "person_id",
        "calories",
        "protein",
        "carbs",
        "fats",
        "fiber",
        "sugar_limit",
        "sat_fats_limit",
        "water",
      ],
      include: [
        {
          model: Person,
          as: "person",
        },
      ],
    });
  },

  async create(body, t) {
    try {
      const newProfile = await NutritionProfile.create(
        {
          person_id: body.person_id,
          calories: body.calories || null,
          protein: body.protein || null,
          carbs: body.carbs || null,
          fats: body.fats || null,
          fiber: body.fiber || null,
          sugar_limit: body.sugar_limit || null,
          sat_fats_limit: body.sat_fats_limit || null,
          water: body.water || null,
        },
        { transaction: t }
      );

      logger.info(
        `Perfil nutricional creado para person_id: ${body.person_id}`
      );
      return newProfile;
    } catch (err) {
      logger.error(
        `Error en NutritionProfileRepository->create: ${err.message}`
      );
      throw err;
    }
  },

  async update(profileRecord, body, t) {
    const fieldsToUpdate = [
      "calories",
      "protein",
      "carbs",
      "fats",
      "fiber",
      "sugar_limit",
      "sat_fats_limit",
      "water",
    ];
    const updatedData = {};

    try {
      Object.keys(body).forEach((key) => {
        if (fieldsToUpdate.includes(key) && body[key] !== undefined) {
          updatedData[key] = body[key];
        }
      });

      if (Object.keys(updatedData).length > 0) {
        await profileRecord.update(updatedData, { transaction: t });
        logger.info(`Perfil nutricional actualizado (ID: ${profileRecord.id})`);
      }

      return profileRecord;
    } catch (err) {
      logger.error(
        `Error en NutritionProfileRepository->update: ${err.message}`
      );
      throw err;
    }
  },

  async delete(profileRecord) {
    try {
      const deleted = await profileRecord.destroy();
      logger.info(`Perfil nutricional eliminado (ID: ${profileRecord.id})`);
      return deleted;
    } catch (err) {
      logger.error(
        `Error en NutritionProfileRepository->delete: ${err.message}`
      );
      throw err;
    }
  },
};

module.exports = NutritionProfileRepository;
