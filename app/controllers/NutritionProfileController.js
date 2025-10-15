const { NutritionProfile, Person } = require("../models");
const logger = require("../../config/logger");
const { NutritionProfileRepository, PersonRepository, HomePersonRepository, SuggestionRepository, MealEntryRepository, DailyLogRepository, RecipeRepository } = require("../repositories");
const i18n = require("../../config/i18n-config");

const NutritionProfileController = {
  /**
   * Get all nutrition profiles
   */
  async index(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Accessing nutrition profiles`);
    try {
      const profiles = await NutritionProfileRepository.findAll();

      if (!profiles.length) {
        return res.status(204).json({ msg: "NutritionProfilesNotFound", profiles: [] });
      }

      const mappedProfiles = profiles.map((profile) => ({
        id: profile.id,
        personId: profile.person_id,
        person_id: profile.person_id,
        calories: profile.calories,
        protein: profile.protein,
        carbs: profile.carbs,
        fats: profile.fats,
        fiber: profile.fiber,
        sugar_limit: profile.sugar_limit,
        sat_fats_limit: profile.sat_fats_limit,
        water: profile.water,
        person: profile.person
          ? {
              id: profile.person.id,
              name: profile.person.name,
              email: profile.person.email
            }
          : null
      }));

      return res.status(200).json({ profiles: mappedProfiles });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("NutritionProfileController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get a nutrition profile by ID
   */
  async show(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Searching for nutrition profile with ID ${req.body.id}`);
    try {
      const profile = await NutritionProfileRepository.findById(req.body.id);

      if (!profile) {
        return res.status(204).json({ msg: "NutritionProfileNotFound" });
      }

      const mappedProfile = {
        id: profile.id,
        personId: profile.person_id,
        person_id: profile.person_id,
        calories: profile.calories,
        protein: profile.protein,
        carbs: profile.carbs,
        fats: profile.fats,
        fiber: profile.fiber,
        sugar_limit: profile.sugar_limit,
        sat_fats_limit: profile.sat_fats_limit,
        water: profile.water,
        person: profile.person
          ? {
              id: profile.person.id,
              name: profile.person.name,
              email: profile.person.email
            }
          : null
      };

      return res.status(200).json({ profile: mappedProfile });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("NutritionProfileController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Get nutrition profile by person ID
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Searching nutrition profile for person`);
    const { person_id: bodyPersonId } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    if (!person_id) {
      logger.warn("No person_id provided in request");
      return res.status(400).json({ msg: "PersonIdRequired" });
    }

    try {
      const profile = await NutritionProfileRepository.findByPersonId(person_id);

      if (!profile) {
        return res.status(204).json({ msg: "NutritionProfileNotFound" });
      }

      const mappedProfile = {
        id: profile.id,
        personId: profile.person_id,
        person_id: profile.person_id,
        calories: profile.calories,
        protein: profile.protein,
        carbs: profile.carbs,
        fats: profile.fats,
        fiber: profile.fiber,
        sugar_limit: profile.sugar_limit,
        sat_fats_limit: profile.sat_fats_limit,
        water: profile.water,
        person: profile.person
          ? {
              id: profile.person.id,
              name: profile.person.name,
              email: profile.person.email
            }
          : null
      };

      return res.status(200).json({ profile: mappedProfile });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("NutritionProfileController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Create a new nutrition profile
   */
  async store(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Creating new nutrition profile`);
    logger.info("Received data:");
    logger.info(JSON.stringify(req.body));

    const { person_id: bodyPersonId } = req.body;
    const person_id = bodyPersonId || req.person?.id;

    req.body.person_id = person_id;

    try {

      const profile = await NutritionProfileRepository.create(req.body);
      return res.status(201).json({ profile: profile, message: "Registro creado correctamente" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("NutritionProfileController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Update a nutrition profile
   */
  async update(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Updating nutrition profile with ID ${req.body.id}`);
    logger.info("Received data:");
    logger.info(JSON.stringify(req.body));

    try {
      const profile = await NutritionProfileRepository.findById(req.body.id);

      if (!profile) {
        return res.status(404).json({ msg: "NutritionProfileNotFound" });
      }

      const updatedProfile = await NutritionProfileRepository.update(profile, req.body);
      return res.status(200).json({ profile: updatedProfile, message: "Registro editado correctamente" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("NutritionProfileController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Delete a nutrition profile
   */
  async destroy(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Deleting nutrition profile with ID ${req.body.id}`);

    try {
      const profile = await NutritionProfileRepository.findById(req.body.id);

      if (!profile) {
        return res.status(404).json({ msg: "NutritionProfileNotFound" });
      }

      await NutritionProfileRepository.delete(profile);
      return res.status(200).json({ msg: "NutritionProfileDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Unknown error";

      logger.error("NutritionProfileController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getCurrentLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  async getPersonProfileNutrition(req, res) {
  logger.info(`${req.user.name} - Accediendo al perfil nutricional de una persona`);
  try {
    const { home_id, person_id: bodyPersonId, type } = req.body;
    let person_id = bodyPersonId || req.person?.id;

    // 1. Obtener datos básicos de la persona
    const person = await PersonRepository.findById(person_id);
    const mappedPerson = {
      id: person.id,
      userId: person.user_id,
      name: person.name,
      user: person.user.name,
      language: person.user.language,
      birthDate: person.birth_date,
      age: person.age,
      gender: person.gender,
      email: person.email,
      phone: person.phone,
      address: person.address,
      image: person.image,
      date: person.updatedAt
        ? `${person.updatedAt.getFullYear()}-${String(person.updatedAt.getMonth() + 1).padStart(2, "0")}-${String(person.updatedAt.getDate()).padStart(2, "0")}`
        : await this.getCurrentLocalDate(),
    };

    // 2. Personas del hogar
    const homePerson = await HomePersonRepository.getPersonByHomeId(home_id);

    // 3. Sugerencias de nutrición
    const allSuggestions = await SuggestionRepository.findTodaySuggestions("Nutrition", person_id, home_id);
    const suggestionStatusData = [
      { id: "Pendiente", name: "Pendiente", description: "La sugerencia está en espera de revisión" },
      { id: "Revisado", name: "Revisado", description: "La sugerencia ha sido revisada" },
      { id: "Completado", name: "Completado", description: "La sugerencia ha sido resuelta" },
    ];
    const translatedSuggestionStatusData = suggestionStatusData.map((item) => ({
      id: item.id,
      name: i18n.__(`suggestionStatus.${item.id}.name`) !== `suggestionStatus.${item.id}.name`
        ? i18n.__(`suggestionStatus.${item.id}.name`)
        : item.name,
      description: i18n.__(`suggestionStatus.${item.id}.description`) !== `suggestionStatus.${item.id}.description`
        ? i18n.__(`suggestionStatus.${item.id}.description`)
        : item.description,
      statusName: item.name,
    }));
    const mappedSuggestions = allSuggestions.map((suggestion) => ({
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      content: suggestion.content,
      status: suggestion.status,
      homeId: suggestion.home_id,
      home_id: suggestion.home_id,
      start_date: suggestion.date,
      type: suggestion.typeTask,
      taskData: suggestion.taskData,
    }));

    // === NUTRICIÓN ===
    let nutritionData = null;
    const today = new Date().toISOString().split('T')[0];

    // Función para determinar el estado nutricional
    const getNutritionStatus = (score) => {
      if (score >= 80) return { 
        level: 'Excelente', 
        message: 'Tu alimentación es balanceada y variada',
        icon: 'mdi-emoticon-excited',
        color: 'green'
      };
      if (score >= 60) return { 
        level: 'Bueno', 
        message: 'Generalmente comes bien, con algunos excesos',
        icon: 'mdi-emoticon-happy',
        color: 'amber'
      };
      if (score >= 40) return { 
        level: 'Aceptable', 
        message: 'Faltan más frutas, verduras o agua',
        icon: 'mdi-emoticon-neutral',
        color: 'orange'
      };
      if (score >= 20) return { 
        level: 'En riesgo', 
        message: 'Alimentación poco saludable con frecuencia',
        icon: 'mdi-emoticon-sad',
        color: 'red'
      };
      return { 
        level: 'Crítico', 
        message: 'Muy mala nutrición, afecta tu bienestar',
        icon: 'mdi-emoticon-dead',
        color: 'red'
      };
    };

    const householdMembers = await NutritionProfileRepository.findNutritionDataByHomeId(
      home_id,
      today,
      type === 'Personal' ? person_id : null
    );

    const membersData = [];
    let membersWithData = 0;

    for (const person of householdMembers) {
      const profile = person.nutritionProfile;
      const dailyLog = person.dailyLogs?.[0]; // Solo el log del día

      let mealsOfTheDay = [];
      let caloriesConsumed = 0, protein = 0, carbs = 0, fats = 0, fiber = 0;

      if (dailyLog) {
        mealsOfTheDay = dailyLog.mealEntries.map(meal => ({
          type: meal.mealType?.name || 'Sin tipo',
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

      const status = getNutritionStatus(overallScore); // ← extrae la función

      const alerts = [];
      if (fiber < fiberGoal) alerts.push("Bajo consumo de fibra hoy");
      if ((dailyLog?.water_intake || 0) < waterGoal) alerts.push("Bajo consumo de agua hoy");

      const hasData = !!dailyLog;
      if (hasData) membersWithData++;

      membersData.push({
        id: person.id,
        name: person.name,
        image: person.image,
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
        hasData,
        mealsOfTheDay
      });
    }

    // === Calcular estado AGREGADO del hogar ===
    let excellent = 0, bueno = 0, aceptable = 0, enRiesgo = 0, critico = 0;
    let totalFiberAlerts = 0, totalWaterAlerts = 0;

    membersData.forEach(member => {
      if (member.hasData) {
        switch (member.status.level) {
          case 'Excelente': excellent++; break;
          case 'Bueno': bueno++; break;
          case 'Aceptable': aceptable++; break;
          case 'En riesgo': enRiesgo++; break;
          case 'Crítico': critico++; break;
        }
        if (member.alerts.includes("Bajo consumo de fibra hoy")) totalFiberAlerts++;
        if (member.alerts.includes("Bajo consumo de agua hoy")) totalWaterAlerts++;
      }
    });

    const totalMembers = householdMembers.length;
    const globalScore = (
      (excellent / totalMembers) * 100 +
      (bueno / totalMembers) * 75 +
      (aceptable / totalMembers) * 50 +
      (enRiesgo / totalMembers) * 25 +
      (critico / totalMembers) * 0
    );

    const globalStatus = getNutritionStatus(globalScore);

    // === Alertas generales ===
    const globalAlerts = [];
    if (totalFiberAlerts > 0) {
      globalAlerts.push(`${totalFiberAlerts} ${totalFiberAlerts === 1 ? 'miembro' : 'miembros'} con bajo consumo de fibra`);
    }
    if (totalWaterAlerts > 0) {
      globalAlerts.push(`${totalWaterAlerts} ${totalWaterAlerts === 1 ? 'miembro' : 'miembros'} con bajo consumo de agua`);
    }

    nutritionData = {
      membersData,
      totalMembers,
      membersWithNutritionData: membersWithData,
      status: globalStatus,   // ← estado agregado
      alerts: globalAlerts    // ← alertas agregadas
    };

    /*if (type === 'Personal') {
      const profile = await NutritionProfileRepository.findByPersonId(person_id);
      const dailyLog = await DailyLogRepository.findByPersonIdAndDate(person_id, today);
      
      let mealsOfTheDay = [];
      let caloriesConsumed = 0, protein = 0, carbs = 0, fats = 0, fiber = 0;

      if (dailyLog) {
        const meals = await MealEntryRepository.findByDailyLogId(dailyLog.id);
        mealsOfTheDay = meals.map(meal => ({
          type: meal.mealType?.name || 'Sin tipo',
          recipes: meal.mealRecipes?.map(mr => mr.recipe.name).join(' + ') || 'Sin recetas',
          details: meal.mealRecipes?.map(mr => ({
            name: mr.recipe.name,
            servings: mr.servings
          })) || []
        }));

        meals.forEach(meal => {
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
      const status = getNutritionStatus(overallScore);

      const alerts = [];
      if (fiber < fiberGoal) alerts.push("Bajo consumo de fibra hoy");
      if ((dailyLog?.water_intake || 0) < waterGoal) alerts.push("Bajo consumo de agua hoy");

      nutritionData = {
        type: 'Personal',
        status,
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
        alerts,
        mealsOfTheDay
      };

    } else if (type === 'Hogar') {
      const homePersons = await HomePersonRepository.getPersonByHomeId(home_id);
      const personIds = homePersons.map(p => p.id);

      let totalCalories = 0, totalWater = 0, totalFiber = 0;
      let membersWithData = 0;

      for (const pid of personIds) {
        const profile = await NutritionProfileRepository.findByPersonId(pid);
        const dailyLog = await DailyLogRepository.findByPersonIdAndDate(pid, today);
        
        if (dailyLog) {
          membersWithData++;
          const meals = await MealEntryRepository.findByDailyLogId(dailyLog.id);
          let personCalories = 0, personFiber = 0;
          
          meals.forEach(meal => {
            meal.mealRecipes?.forEach(mr => {
              const ratio = mr.servings / (mr.recipe.servings || 1);
              personCalories += (mr.recipe.calories || 0) * ratio;
              personFiber += (mr.recipe.fiber || 0) * ratio;
            });
          });

          totalCalories += personCalories;
          totalWater += dailyLog.water_intake || 0;
          totalFiber += personFiber;
        }
      }

      const avgCalories = membersWithData ? totalCalories / membersWithData : 0;
      const avgWater = membersWithData ? totalWater / membersWithData : 0;
      const avgFiber = membersWithData ? totalFiber / membersWithData : 0;

      const caloriesGoal = 2000;
      const waterGoal = 2.0;
      const fiberGoal = 30;

      const caloriesScore = Math.min(100, Math.round((avgCalories / caloriesGoal) * 100));
      const waterScore = Math.min(100, Math.round((avgWater / waterGoal) * 100));
      const fiberScore = Math.min(100, Math.round((avgFiber / fiberGoal) * 100));

      const overallScore = Math.round((caloriesScore + waterScore + fiberScore) / 3);
      const status = getNutritionStatus(overallScore);

      nutritionData = {
        type: 'Hogar',
        status,
        summary: {
          averageCaloriesConsumed: Math.round(avgCalories),
          averageWaterConsumed: parseFloat(avgWater.toFixed(1)),
          averageFiberConsumed: Math.round(avgFiber),
          caloriesGoal,
          waterGoal,
          fiberGoal
        },
        weeklyProgress: {
          calories: caloriesScore,
          water: waterScore,
          fiber: fiberScore
        },
        totalMembers: personIds.length,
        membersWithNutritionData: membersWithData
      };
    }*/

    // === RESPUESTA FINAL ===
    res.status(200).json({
      person: mappedPerson,
      homeperson: homePerson,
      suggestions: mappedSuggestions,
      statusuggestions: translatedSuggestionStatusData,
      nutritionData // 👈 Datos nutricionales completos
    });

    } catch (error) {
    const errorMsg = error.details
      ? error.details.map((detail) => detail.message).join(", ")
      : error.message || "Error desconocido";
    logger.error("PeopleController->getPersonProfileNutrition: " + errorMsg);
    return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getNutritionProfileByPersonId(req, res) {
  logger.info(`${req.user.name} - Obtiene perfil nutricional por persona`);
  try {
    const { person_id: bodyPersonId } = req.body;
    const person_id = bodyPersonId || req.person?.id;
    const today = new Date().toISOString().split('T')[0];

    // 1. Perfil nutricional
    const profile = await NutritionProfileRepository.findByPersonId(person_id);

    // 2. Recetas de la persona
    const recipes = await RecipeRepository.findByPersonId(person_id);
    const totalRecipes = recipes.length;

    // 3. Registro diario
    const dailyLog = await DailyLogRepository.findByPersonIdAndDate(person_id, today);
    const waterIntake = dailyLog?.water_intake || 0;
    const sleepHours = dailyLog?.sleep_hours || 0;
    const steps = dailyLog?.steps || 0;

    // 4. Comidas del día
    let mealsOfTheDay = [];
    if (dailyLog) {
      const meals = await MealEntryRepository.findByDailyLogId(dailyLog.id);
      mealsOfTheDay = meals.map(meal => ({
        id: meal.id,
        type: meal.mealType?.name || 'Sin tipo',
        recipes: meal.mealRecipes?.map(mr => mr.recipe.name).join(' + ') || 'Sin recetas',
        count: meal.mealRecipes?.length || 0
      }));
    }

    const mappedProfile = {
      id: profile?.id || null,
      personId: person_id,
      calories: profile?.calories || 2000,
      protein: profile?.protein || 80,
      carbs: profile?.carbs || 250,
      fats: profile?.fats || 70,
      fiber: profile?.fiber || 30,
      water: profile?.water || 2.0,
      sugar_limit: profile?.sugar_limit || 25,
      sat_fats_limit: profile?.sat_fats_limit || 20,
      is_private: profile?.is_private || false
    };

    const response = {
      profile: mappedProfile,
      recipes: {
        count: totalRecipes,
        lastRecipe: recipes[0]?.name || null
      },
      dailyLog: {
        waterIntake,
        sleepHours,
        steps,
        hasData: !!dailyLog
      },
      meals: {
        count: mealsOfTheDay.length,
        items: mealsOfTheDay
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("NutritionController->getNutritionProfileByPersonId: " + error.message);
    res.status(500).json({ error: "ServerError", details: error.message });
  }
}
};

module.exports = NutritionProfileController;