const { NutritionProfile, Person, Home, DailyLog, MealEntry, MealRecipe, Recipe, Type } = require("../models");
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
        "water"
      ],
      include: [
        {
          model: Person,
          as: "person"
        }
      ],
      order: [["createdAt", "DESC"]]
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
        "water"
      ],
      include: [
        {
          model: Person,
          as: "person"
        }
      ]
    });
  },

  // NutritionProfileRepository.js

async findNutritionDataByHomeId(homeId, date, personId = null) {
  try {
    const wherePerson = personId ? { id: personId } : {};

    const members = await Person.findAll({
      where: wherePerson,
      include: [
        {
          model: Home,
          as: 'homePersons',
          where: { id: homeId },
          required: true
        },
        {
          model: NutritionProfile,
          as: 'nutritionProfile',
          required: false // Algunos pueden no tener perfil
        },
        {
          model: DailyLog,
          as: 'dailylogs',
          where: { date },
          required: false,
          include: [
            {
              model: MealEntry,
              as: 'mealEntries',
              required: false,
              include: [
                {
                  model: MealRecipe,
                  as: 'mealRecipes',
                  required: false,
                  include: [{ model: Recipe, as: 'recipe' }]
                },
                { model: Type, as: 'type', required: false }
              ]
            }
          ]
        }
      ],
      order: [['name', 'ASC']]
    });

    // Procesar los resultados en el repositorio (no en el controlador)
    return members.map(person => {
      const profile = person.nutritionProfile;
      const dailyLog = person.dailyLogs?.[0]; // Solo el registro de hoy

      let caloriesConsumed = 0, protein = 0, carbs = 0, fats = 0, fiber = 0;
      let mealsOfTheDay = [];

      if (dailyLog && dailyLog.mealEntries) {
        mealsOfTheDay = dailyLog.mealEntries.map(meal => ({
          type: meal.type?.name || 'Sin tipo',
          recipes: meal.mealRecipes?.map(mr => mr.recipe.name).join(' + ') || 'Sin recetas'
        }));

        dailyLog.mealEntries.forEach(meal => {
          meal.mealRecipes?.forEach(mr => {
            const ratio = mr.servings / (mr.recipe.servings || 1);
            caloriesConsumed += (mr.recipe.calories || 0) * ratio;
            protein += (mr.recipe.protein || 0) * ratio;
            carbs += (mr.recipe.carbs || 0) * ratio;
            fats += (mr.recipe.fats || 0) * ratio;
            fiber += (mr.recipe.fiber || 0) * ratio;
          });
        });
      }

      const caloriesGoal = profile?.calories || 2000;
      const waterGoal = profile?.water || 2.0;
      const fiberGoal = profile?.fiber || 30;

      const caloriesScore = Math.min(100, Math.round((caloriesConsumed / caloriesGoal) * 100));
      const waterScore = Math.min(100, Math.round(((dailyLog?.water_intake || 0) / waterGoal) * 100));
      const fiberScore = Math.min(100, Math.round((fiber / fiberGoal) * 100));
      const overallScore = Math.round((caloriesScore + waterScore + fiberScore) / 3);

      const getNutritionStatus = (score) => {
        if (score >= 80) return { level: 'Excelente', color: 'green' };
        if (score >= 60) return { level: 'Bueno', color: 'amber' };
        if (score >= 40) return { level: 'Aceptable', color: 'orange' };
        if (score >= 20) return { level: 'En riesgo', color: 'red' };
        return { level: 'Crítico', color: 'red' };
      };

      const status = getNutritionStatus(overallScore);

      const alerts = [];
      if (fiber < fiberGoal) alerts.push("Bajo consumo de fibra hoy");
      if ((dailyLog?.water_intake || 0) < waterGoal) alerts.push("Bajo consumo de agua hoy");

      return {
        id: person.id,
        name: person.name,
        image: person.image || 'people/default.jpg',
        summary: {
          caloriesConsumed: Math.round(caloriesConsumed),
          caloriesGoal,
          waterConsumed: dailyLog?.water_intake || 0,
          waterGoal,
          protein: Math.round(protein),
          carbs: Math.round(carbs),
          fats: Math.round(fats),
          fiber: Math.round(fiber),
          fiberGoal
        },
        status,
        alerts,
        hasData: !!dailyLog,
        mealsOfTheDay
      };
    });
  } catch (error) {
    logger.error('NutritionProfileRepository->findNutritionDataByHomeId:', error.message);
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
        "water"
      ],
      include: [
        {
          model: Person,
          as: "person"
        }
      ]
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
          water: body.water || null
        },
        { transaction: t }
      );

      logger.info(`Perfil nutricional creado para person_id: ${body.person_id}`);
      return newProfile;
    } catch (err) {
      logger.error(`Error en NutritionProfileRepository->create: ${err.message}`);
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
      "water"
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
      logger.error(`Error en NutritionProfileRepository->update: ${err.message}`);
      throw err;
    }
  },

  async delete(profileRecord) {
    try {
      const deleted = await profileRecord.destroy();
      logger.info(`Perfil nutricional eliminado (ID: ${profileRecord.id})`);
      return deleted;
    } catch (err) {
      logger.error(`Error en NutritionProfileRepository->delete: ${err.message}`);
      throw err;
    }
  }
};

module.exports = NutritionProfileRepository;