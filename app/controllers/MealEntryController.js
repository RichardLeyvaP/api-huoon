const logger = require("../../config/logger");
const { MealEntryRepository, DailyLogRepository, RecipeRepository, TypeRepository, MealRecipeRepository } = require("../repositories");
const { sequelize } = require("../models");
const i18n  = require("../../config/i18n-config");

const MealEntryController = {
  async index(req, res) {
    try {
      const meals = await MealEntryRepository.findAll();
      if (!meals.length)
        return res.status(204).json({ msg: "MealEntriesNotFound", meals: [] });
      return res.status(200).json({ meals });
    } catch (err) {
      logger.error("MealEntryController->index: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async getByDailyLogId(req, res) {
    const { daily_log_id } = req.body;
    if (!daily_log_id)
      return res.status(400).json({ msg: "DailyLogIdRequired" });

    try {
      const meals = await MealEntryRepository.findByDailyLogId(daily_log_id);
      return res.status(200).json({ meals });
    } catch (err) {
      logger.error("MealEntryController->getByDailyLogId: " + err.message);
      res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async getByPersonIdAndDate(req, res) {
    const {person_id: bodyPersonId, date } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    if (!person_id || isNaN(person_id)) {
      return res.status(400).json({ msg: "PersonIdRequired" });
    }

    try {
      const mealEntries = await MealEntryRepository.findByPersonIdAndDate(
        person_id,
        date
      );

      const result = mealEntries.map((meal) => {
        const originalTypeName = meal.type?.name || null;
        const originalTypeDesc = meal.type?.description || null;

        // Traducción con fallback
        const translatedName = originalTypeName
          ? i18n.__(`types.${originalTypeName}.name`) !==
            `types.${originalTypeName}.name`
            ? i18n.__(`types.${originalTypeName}.name`)
            : originalTypeName
          : null;

        const translatedDescription = originalTypeName
          ? i18n.__(`types.${originalTypeName}.description`) !==
            `types.${originalTypeName}.description`
            ? i18n.__(`types.${originalTypeName}.description`)
            : originalTypeDesc
          : null;

        return {
          date: meal.dailyLog.date,
          id: meal.id,
          daily_log_id: meal.daily_log_id,
          type_id: meal.type_id,
          typeName: translatedName,
          type: originalTypeName, // nombre original sin traducir
          notes: meal.notes,
          meal_recipes: meal.mealRecipes.map((mr) => ({
            recipe_id: mr.recipe_id,
            servings: mr.servings,
            name: mr.recipe?.name || null,
            image: mr.recipe?.image || null,
            description: mr.recipe?.description || null,
            servingsRecipe: mr.recipe?.servings || null, // evita colisión con servings de MealRecipe
            calories: mr.recipe?.calories || null,
            protein: mr.recipe?.protein || null,
          })),
        };
      });

      return res.status(200).json({ meals: result });
    } catch (err) {
      logger.error("MealEntryController->getByPersonIdAndDate: " + err.message);
      return res
        .status(500)
        .json({ error: "ServerError", details: err.message });
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
    logger.info(`${req.user?.name || 'Anonymous'} - Crea MealEntry`);
    logger.info("datos recibidos:");
    logger.info(JSON.stringify(req.body));

    const { person_id: bodyPersonId, date, daily_log_id, meal_recipes } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    if (!person_id) {
      return res.status(400).json({ msg: "PersonIdRequired" });
    }

    const t = await sequelize.transaction();
    try {
      // ✅ 1. Obtener o crear DailyLog
      let dailyLog;
      if (daily_log_id) {
        dailyLog = await DailyLogRepository.findById(daily_log_id, t);
        if (!dailyLog) {
          await t.rollback();
          return res.status(404).json({ msg: "DailyLogNotFound" });
        }
        if (dailyLog.person_id !== person_id) {
          await t.rollback();
          return res.status(403).json({ msg: "Unauthorized" });
        }
      } else {
        // Crear o encontrar DailyLog por date + person_id
        const logDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        dailyLog = await DailyLogRepository.findOne({
          where: { person_id, date: logDate },
          transaction: t
        });
        if (!dailyLog) {
          dailyLog = await DailyLogRepository.create({
            person_id,
            date: logDate,
            water_intake: null,
            sleep_hours: null,
            steps: null,
            notes: null
          }, t);
        }
      }

      // ✅ 2. Crear MealEntry
      const mealEntryData = {
        daily_log_id: dailyLog.id,
        type_id: req.body.type_id,
        notes: req.body.notes || null
      };
      const mealEntry = await MealEntryRepository.create(mealEntryData, t);

      // ✅ 3. Procesar mealRecipes (si existen)
      if (meal_recipes && Array.isArray(meal_recipes) && meal_recipes.length > 0) {
        const recipeIds = meal_recipes.map(mr => Number(mr.recipe_id));
        const dbRecipes = await RecipeRepository.findByIds(recipeIds, t);

        const foundIds = new Set(dbRecipes.map(r => r.id));
        const missing = recipeIds.filter(id => !foundIds.has(id));
        if (missing.length > 0) {
          await t.rollback();
          return res.status(400).json({ msg: `Recetas no encontradas o no autorizadas: ${missing.join(', ')}` });
        }

        // 👇 Crear asociaciones MealRecipe
        await MealRecipeRepository.upsertForMealEntry(mealEntry.id, meal_recipes, t);
      }

      await t.commit();
      const fullMealEntry = await MealEntryRepository.findById(mealEntry.id);
      return res.status(201).json({ mealEntry: fullMealEntry, message: "MealEntry creado correctamente" });
    } catch (err) {
      await t.rollback();
      logger.error("MealEntryController->store: " + err.message);
      return res.status(500).json({ error: "ServerError", details: err.message });
    }
  },

  async update(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Edita MealEntry con ID ${req.body.id}`);
    logger.info("datos recibidos:");
    logger.info(JSON.stringify(req.body));

    const { person_id: bodyPersonId, date, meal_recipes } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    const t = await sequelize.transaction();
    try {
      // 1. Obtener MealEntry existente
      const mealEntry = await MealEntryRepository.findById(req.body.id, t);
      if (!mealEntry) {
        await t.rollback();
        return res.status(404).json({ msg: "MealEntryNotFound" });
      }

      // 2. Obtener el DailyLog actual
      const currentDailyLog = await DailyLogRepository.findById(mealEntry.daily_log_id, t);
      if (!currentDailyLog) {
        await t.rollback();
        return res.status(404).json({ msg: "DailyLogOriginalNotFound" });
      }

      const originalPersonId = currentDailyLog.person_id;
      if (person_id && person_id !== originalPersonId) {
        await t.rollback();
        return res.status(403).json({ msg: "Unauthorized" });
      }

      // ✅ 3. Lógica de actualización de fecha (solo si se pasa `date`)
      let targetDailyLog = currentDailyLog; // por defecto, mantener el actual

      if (date !== undefined) {
        // Buscar DailyLog en la nueva fecha
        let newDailyLog = await DailyLogRepository.findOne({
          where: { person_id: originalPersonId, date: date },
          transaction: t
        });

        if (!newDailyLog) {
          // Crear nuevo DailyLog en la fecha especificada
          newDailyLog = await DailyLogRepository.create({
            person_id: originalPersonId,
            date: date,
            water_intake: null,
            sleep_hours: null,
            steps: null,
            notes: null
          }, t);
        }

        // Solo actualizar si es diferente al actual
        if (newDailyLog.id !== currentDailyLog.id) {
          targetDailyLog = newDailyLog;
        }
      }

      // 4. Actualizar campos básicos (excluyendo meal_recipes)
      const { meal_recipes: _, ...otherFields } = req.body;
      const updateData = { ...otherFields };

      // Actualizar daily_log_id solo si cambió
      if (targetDailyLog.id !== mealEntry.daily_log_id) {
        updateData.daily_log_id = targetDailyLog.id;
      }

      if (Object.keys(updateData).length > 0) {
        await mealEntry.update(updateData, { transaction: t });
      }

      // 5. Procesar meal_recipes
      const hasMealRecipesField = 'meal_recipes' in req.body;
      if (hasMealRecipesField) {
        if (Array.isArray(meal_recipes) && meal_recipes.length > 0) {
          const recipeIds = meal_recipes.map(mr => Number(mr.recipe_id));
          const dbRecipes = await RecipeRepository.findByIds(recipeIds, t);
          const foundIds = new Set(dbRecipes.map(r => r.id));
          const missing = recipeIds.filter(id => !foundIds.has(id));
          if (missing.length > 0) {
            await t.rollback();
            return res.status(400).json({ msg: `Recetas no encontradas o no autorizadas: ${missing.join(', ')}` });
          }
          await MealRecipeRepository.upsertForMealEntry(mealEntry.id, meal_recipes, t);
        } 
      }

      // ✅ 6. Eliminar el DailyLog original si ya no tiene MealEntries y no tiene otros datos
      if (targetDailyLog.id !== currentDailyLog.id) {
        const remainingEntries = await DailyLogRepository.countByDailyLogId(currentDailyLog.id, t);
        // Solo eliminar si no tiene otros datos significativos
        const isEmptyLog = (
          currentDailyLog.water_intake === null &&
          currentDailyLog.sleep_hours === null &&
          currentDailyLog.steps === null &&
          currentDailyLog.notes === null
        );
        if (remainingEntries === 0 && isEmptyLog) {
          await DailyLogRepository.delete(currentDailyLog, t);
        }
      }

      await t.commit();
      const updatedMealEntry = await MealEntryRepository.findById(mealEntry.id);
      return res.status(200).json({ message: "MealEntry actualizado correctamente", mealEntry: updatedMealEntry });
    } catch (err) {
      await t.rollback();
      logger.error("MealEntryController->update: " + err.message);
      return res.status(500).json({ error: "ServerError", details: err.message });
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
  },


  async getTypesByRecipes(req, res) {
   const {person_id: bodyPersonId, type } = req.body;
    const person_id = bodyPersonId || req.person?.id;

  try {
    // 1. Obtener todos los types (sin filtro, asumimos que son pocos y fijos)
    const allTypes = await TypeRepository.findByType(type);

    if (!allTypes || allTypes.length === 0) {
      return res.status(404).json({ message: "No se encontraron tipos de comida." });
    }

    // Formatear types con traducción
    const formattedTypes = allTypes.map(typeItem => {
      const key = typeItem.name;

      const translatedName = i18n.__(`types.${key}.name`) !== `types.${key}.name`
        ? i18n.__(`types.${key}.name`)
        : typeItem.name;

      const translatedDescription = i18n.__(`types.${key}.description`) !== `types.${key}.description`
        ? i18n.__(`types.${key}.description`)
        : typeItem.description;

      return {
        ...typeItem.toJSON(),
        nameTranslated: translatedName,
        descriptionTranslated: translatedDescription,
      };
    });

    // 2. Obtener recetas de la persona
    const recipes = await RecipeRepository.findByPersonId(person_id);

    // 3. Responder
    return res.status(200).json({
      types: formattedTypes,
      recipes: recipes,
    });
  } catch (err) {
    logger.error("MealEntryController->getCreationOptions: " + err.message);
    return res.status(500).json({ error: "ServerError", details: err.message });
  }
}
};

module.exports = MealEntryController;
