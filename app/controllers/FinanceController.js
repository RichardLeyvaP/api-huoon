const { Finance, Person, sequelize } = require("../models"); // Importar el modelo Finance
const logger = require("../../config/logger"); // Importa el logger
const i18n = require("../../config/i18n-config");
const {
  FinanceRepository,
  PersonRepository,
  HomeRepository,
  SuggestionRepository,
  BudgetRepository,
  CategoryRepository,
} = require("../repositories"); // Asegúrate de que tengas un repositorio para Finance
const FinancialAIService = require("../services/FinancesSuggestion");
const CategoryService = require("../services/CategoryService");

const FinanceController = {
  // Obtener todos los registros de finanzas
  async index(req, res) {
    logger.info(`${req.user.name} - Entra a buscar los registros financieros`);

    try {
      const finances = await FinanceRepository.findAll();

      if (!finances.length) {
        return res.status(204).json({ msg: "FinancesNotFound" });
      }

      // Mapear la respuesta
      const mappedFinances = finances.map((finance) => {
        return {
          id: finance.id,
          homeId: finance.home_id,
          home_id: finance.home_id,
          personId: finance.person_id,
          person_id: finance.person_id,
          spent: finance.spent,
          income: finance.income,
          available: finance.available,
          date: finance.date,
          description: finance.description,
          type:i18n.__(`finances.${finance.type}.name`) !==
            `finances.${finance.type}.name`
              ? i18n.__(`finances.${finance.type}.name`)
              : finance.type,
          method: finance.method,
          image: finance.image,
          finance: finance.income ? 'Ingreso' : 'Gasto',
          idType: finance.type
        };
      });

      res.status(200).json({ finances: mappedFinances });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getTypeFinances(req, res) {
    logger.info(`${req.user.name} - Entra a buscar los registros financieros`);

    const { home_id, type } = req.body;
    const home = await HomeRepository.findById(home_id);
    if (!home) {
      logger.error(
        `FinanceController->getHomeFinances : Hogar no encontrado con ID ${home_id}`
      );
      return res.status(404).json({ msg: "HomeNotFound" });
    }    
    const person_id = req.person.id;

    try {
      let finances = [];
      if (type === 'Hogar') {
        finances = await FinanceRepository.findAllType(home_id, null,type);
      }
      else if (type === 'Personal'){
        finances = await FinanceRepository.findAllType(person_id, null,type);
      }else{
        finances = await FinanceRepository.findAllType(person_id, home_id, type);
      }


      if (!finances.length) {
        return res.status(204).json({ msg: "FinancesNotFound" });
      }

      // Mapear la respuesta
      const mappedFinances = finances.map((finance) => {
        return {
          id: finance.id,
          homeId: finance.home_id,
          home_id: finance.home_id,
          personId: finance.person_id,
          person_id: finance.person_id,
          spent: finance.spent,
          income: finance.income,
          available: finance.available,
          date: finance.date,
          description: finance.description,
          type:i18n.__(`finances.${finance.type}.name`) !==
            `finances.${finance.type}.name`
              ? i18n.__(`finances.${finance.type}.name`)
              : finance.type,
          method: finance.method,
          image: finance.image,
          finance: finance.income ? 'Ingreso' : 'Gasto',
          idType: finance.type
        };
      });

      res.status(200).json({ finances: mappedFinances });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getTypeFinancesRange(req, res) {
    logger.info(`${req.user.name} - Buscando registros financieros con rango`);

    const { home_id, type, startDate, endDate } = req.body;
    const home = await HomeRepository.findById(home_id);
    if (!home) {
        logger.error(`Hogar no encontrado con ID ${home_id}`);
        return res.status(404).json({ msg: "HomeNotFound" });
    }
    
    const person_id = req.person.id;

    try {
        // Preparar el objeto dateRange
        const dateRange = {};
        
        // Solo asignar las fechas si fueron proporcionadas
        if (startDate) dateRange.startDate = startDate;
        if (endDate) dateRange.endDate = endDate;

        let finances = [];
        
        finances = await FinanceRepository.findAllTypeRange(person_id, home_id, type, dateRange);

        if (!finances.length) {
            logger.info('No se encontraron registros financieros');
            return res.status(204).json({ msg: "FinancesNotFound" });
        }

       // Mapear la respuesta con categorías traducidas
        const mappedFinances = finances.map((finance) => {
            // Traducción de la categoría
            const categoryName = finance.budget?.category?.name;
            let translatedCategory = categoryName;
            
            if (categoryName) {
                const translationKey = `categories.${categoryName}.name`;
                translatedCategory = i18n.__(translationKey) !== translationKey 
                    ? i18n.__(translationKey) 
                    : categoryName;
            }

            return {
                id: finance.id,
                homeId: finance.home_id,
                home_id: finance.home_id,
                personId: finance.person_id,
                person_id: finance.person_id,
                budgetId: finance.budget_id,
                budget_id: finance.budget_id,
                spent: finance.spent,
                income: finance.income,
                available: finance.available,
                date: finance.date,
                description: finance.description,
                type: finance.type,
                typeTranslate: i18n.__(`finances.${finance.type}.name`) !== `finances.${finance.type}.name`
                    ? i18n.__(`finances.${finance.type}.name`)
                    : finance.type,
                method: finance.method,
                image: finance.image,
                finance: finance.income ? 'Ingreso' : 'Gasto',
                idType: finance.type,
                categoryName: translatedCategory,
                categoryOriginal: categoryName,

            };
        });

        logger.info(`Devolviendo ${finances.length} registros financieros`);
        res.status(200).json({ finances: mappedFinances });
    } catch (error) {
        const errorMsg = error.details
            ? error.details.map((detail) => detail.message).join(", ")
            : error.message || "Error desconocido";

        logger.error("Error en getTypeFinancesRange: " + errorMsg);
        res.status(500).json({ 
            error: "ServerError", 
            details: errorMsg,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
  },

  // Crear un nuevo registro financiero
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo registro financiero`);
    logger.info("datos recibidos al crear una finanza");
    logger.info(JSON.stringify(req.body));

    req.body.person_id = req.person.id;
    const {
      home_id,
      person_id,
      spent,
      income,
      date,
      description,
      type,
      method,
      image,
      budget_id,
      available
    } = req.body;

    // Verificar si la persona existe
    const home = await HomeRepository.findById(home_id);
    if (!home) {
      logger.error(
        `FinanceController->store: Hogar no encontrado con ID ${home_id}`
      );
      return res.status(404).json({ msg: "HomeNotFound" });
    }
   if (budget_id) {
    const budget = await BudgetRepository.findById(budget_id);
    if (!budget) {
      logger.error(
        `FinanceController->store: Prespuesto no encontrado con ID ${budget_id}`
      );
      return res.status(404).json({ msg: "BudgetNotFound" });
    }
  }

    // Verificar si la persona existe y pertenece al hogar
    const person = await PersonRepository.getPersonHouse(person_id, home_id);

    if (!person) {
      logger.error(
        `FinanceController->store: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`
      );
      return res.status(404).json({ msg: "PersonNotAssociatedWithHome" });
    }
    

    const t = await sequelize.transaction();
    try {
      const finance = await FinanceRepository.create(req.body, req.file, t);
      await t.commit();
      res.status(201).json({ finance: finance, message: "Registro financiero creado correctamente" });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener un registro financiero por ID
  async show(req, res) {
    logger.info(`${req.user.name} - Entra a buscar un registro financiero`);

    const id = req.body.id; // Asegúrate de convertir a número

    try {
      const finance = await FinanceRepository.findById(id);

      if (!finance) {
        return res.status(404).json({ msg: "FinanceNotFound" });
      }

      const mappedFinance = {
        id: finance.id,
        homeId: finance.home_id,
        home_id: finance.home_id,
        personId: finance.person_id,
        person_id: finance.person_id,
        spent: finance.spent,
        income: finance.income,
        available: finance.available,
        date: finance.date,
        description: finance.description,
        type:i18n.__(`finances.${finance.type}.name`) !==
            `finances.${finance.type}.name`
              ? i18n.__(`finances.${finance.type}.name`)
              : finance.type,
        method: finance.method,
        image: finance.image,
        finance: finance.income ? 'Ingreso' : 'Gasto',
        idType: finance.type
      };

      res.status(200).json({ finance: mappedFinance });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar un registro financiero
  async update(req, res) {
    logger.info(
      `${req.user.name} - Actualiza el registro financiero con ID ${req.body.id}`
    );
    logger.info("datos recibidos al editar una finanza");
    logger.info(JSON.stringify(req.body));

    const {
      id,
      home_id,
      person_id,
      spent,
      income,
      date,
      description,
      type,
      method,
      image,
      available,
      budget_id
    } = req.body;

    const finance = await FinanceRepository.findById(id);

    if (!finance) {
      logger.error(
        `FinanceController->update: Registro financiero no encontrado con ID ${id}`
      );
      return res.status(404).json({ msg: "FinanceNotFound" });
    }

    // Verificar si la persona existe
    if (home_id) {
      // Verificar si el hogar existe
      const home = await HomeRepository.findById(home_id);
      if (!home) {
        logger.error(
          `PersonWarehouseController->update: Hogar no encontrado con ID ${home_id}`
        );
        return res.status(404).json({ msg: "HomeNotFound" });
      }

      if (budget_id) {
    const budget = await BudgetRepository.findById(budget_id);
    if (!budget) {
      logger.error(
        `FinanceController->store: Prespuesto no encontrado con ID ${budget_id}`
      );
      return res.status(404).json({ msg: "BudgetNotFound" });
    }
  }

      // Verificar si la persona existe y pertenece al hogar
      const person = await PersonRepository.getPersonHouse(person_id, home_id);

      if (!person) {
        logger.error(
          `PersonWarehouseController->update: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`
        );
        return res.status(204).json({ msg: "PersonNotAssociatedWithHome" });
      }
    }

    const t = await sequelize.transaction();
    try {
      const financeUpdate = await FinanceRepository.update(
        finance,
        req.body,
        req.file,
        t
      );
      await t.commit();
      res.status(200).json({ finance: financeUpdate, message: "Registro financiero actualizado correctamente" });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar un registro financiero
  async destroy(req, res) {
    logger.info(
      `${req.user.name} - Elimina el registro financiero con ID ${req.body.id}`
    );

    try {
      const finance = await FinanceRepository.findById(req.body.id);

      if (!finance) {
        return res.status(404).json({ msg: "FinanceNotFound" });
      }

      await FinanceRepository.delete(finance);

      res.status(200).json({ msg: "FinanceDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("FinanceController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getPersonFinancialStats(req, res) {
    logger.info(`${req.user.name} - Consulta estadísticas financieras personales`);

    const person_id = req.person.id;
    const dateParam = req.body.date || new Date().toISOString().slice(0, 10);
    const home_id = req.body.home_id;
    const type = req.body.type || "Personal";

    try {

       //const stats = await FinanceRepository.getPersonFinancialStats(person_id);
      //const budgetStats = await BudgetRepository.getPersonBudgetStats(person_id, home_id, type);
      /*// 2. Obtener presupuestos actuales
      const budgets = await BudgetRepository.findAllCurrentByPersonId(person_id, home_id);
      
      // 3. Verificar si ya hay sugerencias hoy
      const todaySuggestions = await SuggestionRepository.findTodaySuggestions(person_id, home_id);
      
      // 4. Generar nuevas sugerencias si no hay o son pocas
      let aiSuggestions = [];
      if (todaySuggestions.length < 3) { // Umbral para generar nuevas
        const aiResponse = await FinancialAIService.generateFinancialSuggestions(
          stats, 
          budgets, 
          todaySuggestions
        );
        aiSuggestions = aiResponse.suggestions || [];
        
        // Guardar nuevas sugerencias
        for (const suggestion of aiSuggestions) {
          await SuggestionRepository.create({
            person_id,
            home_id,
            title: suggestion.title,
            description: suggestion.description,
            content: suggestion.content,
            status: 'Pendiente',
          });
        }
      }*/
      const dataBalance = await FinanceRepository.getAvailableMoneyCurrentMonth(home_id, person_id);
      // 5. Obtener todas las sugerencias (existentes + nuevas)
      const allSuggestions = await SuggestionRepository.findTodaySuggestions('Finanzas', person_id, home_id);

      const financeData = await FinanceRepository.getMonthlyIncomeAndSpentCurrentYear(home_id, person_id, type);
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
        statusName: item.name
      }));
      
      //const suggestions = await SuggestionRepository.findAllByPersonId(person_id, dateParam);
       const mappedSuggestions = allSuggestions.map(suggestion => ({
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
      //const stats = await FinanceRepository.getPersonFinancialStats(person_id);

      // Formatear montos con separadores de miles
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };

      const totalIncome = type === 'Personal' ? dataBalance.personal.income : dataBalance.home.income;
      const totalSpentType = type === 'Personal' ? dataBalance.personal.spent : dataBalance.home.spent;
      //Grafico de pie
      // Estructura: agrupar por categoría principal y sus subcategorías
      const { budgets, expenses } = await FinanceRepository.getAllExpensesAndBudgetCategories(person_id, null, null, home_id, type);

      // Obtener TODAS las categorías de tipo "Budget" (ya traducidas)
      const allBudgetCategories = await CategoryService.getCategories(person_id, "Budget");

      // Mapeo por ID, usando los campos correctos: nameCategory, colorCategory
      const categoryMap = {};
      allBudgetCategories.forEach(cat => {
        categoryMap[cat.id] = {
          id: cat.id,
          name: cat.nameCategory,           // ← clave correcta
          color: cat.colorCategory,         // ← clave correcta
          parent_id: cat.parent_id,
          icon: cat.iconCategory,
          spent: 0,
          budgetAmount: 0,
        };
      });

      // Llenar presupuestos
      budgets.forEach(b => {
        if (categoryMap[b.category.id]) {
          categoryMap[b.category.id].budgetAmount = parseFloat(b.amount) || 0;
        }
      });

      // Llenar gastos
      expenses.forEach(exp => {
        const categoryId = parseInt(exp.categoryId);
        if (categoryMap[categoryId]) {
          categoryMap[categoryId].spent = parseFloat(exp.total) || 0;
        }
      });

      // Obtener categorías padres (sin padre) → para el select y resumen
      const parentCategories = Object.values(categoryMap)
        .filter(cat => cat.parent_id === null)
        .map(cat => ({
          id: cat.id,
          title: cat.name, // ← nombre correcto
          value: cat.id,
          icon: cat.icon,
          color: cat.color || "rgba(var(--v-theme-on-surface), .2)",
        }));

      // Procesar todas las categorías
      const processed = Object.values(categoryMap).map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color || "rgba(var(--v-theme-on-surface), .2)",
        icon: cat.icon,
        parentId: cat.parent_id,
        mainId: cat.parent_id !== null ? cat.parent_id : cat.id,
        spent: cat.spent || 0,
        budgetAmount: cat.budgetAmount || 0,
      }));

      // Agrupar por mainId
      const details = {};
      processed.forEach(item => {
        if (!details[item.mainId]) details[item.mainId] = [];
        details[item.mainId].push(item);
      });

      // Calcular presupuesto total por categoría principal
      const spentByMainId = {};
      parentCategories.forEach(parent => {
        const children = details[parent.id] || [];
        const totalSpent = children.reduce((sum, child) => sum + child.spent, 0);
        spentByMainId[parent.id] = totalSpent;
      });

      // ✅ CAMBIO 2: totalAmount ahora es totalIncome (no totalBudgetAll)
      // const totalBudgetAll = Object.values(budgetByMainId).reduce((sum, b) => sum + b, 0); // ❌ BORRAR

      // --- Generar summary ---
      const summary = parentCategories.map(parent => {
        const children = details[parent.id] || [];
        const totalSpent = children.reduce((sum, child) => sum + child.spent, 0);
        // ✅ CAMBIO 3: Porcentaje contra total ingresado (income), no contra presupuesto
        const percentage = totalSpentType > 0 ? ((totalSpent / totalSpentType) * 100).toFixed(1) : 0;

        return {
          id: parent.id,
          title: parent.title,
          value: parseFloat(percentage),
          color: parent.color,
          icon: parent.icon,
          total: totalSpent.toFixed(2),
        };
      });

      // --- Formatear details ---
      Object.keys(details).forEach(key => {
        const mainId = parseInt(key);
        if (isNaN(mainId)) return;

        const items = details[mainId].filter(item => item.id !== mainId);
        const parentSpent = spentByMainId[mainId] || 0; // ← gasto total del padre

        details[mainId] = items.map(item => {
          const percentage = parentSpent > 0 ? ((item.spent / parentSpent) * 100).toFixed(1) : 0;
          return {
            id: item.id,
            title: item.name,
            value: parseFloat(percentage),
            color: item.color,
            icon: item.icon,
            amount: item.spent.toFixed(2),
            budget: parentSpent.toFixed(2), // ✅ ¡CAMBIO CLAVE! Ahora es el gasto del padre
          };
        });
      });

      const percentage = type === 'Personal' ? dataBalance.personal.spentPercentage : dataBalance.home.spentPercentage;
      const status = FinanceController.getFinancialStatus(percentage);

      const alertsBudget = FinanceController.generateSpendingAlerts( parentCategories, details, spentByMainId, totalIncome, type);

      const expenseTrendAlert = await FinanceController.generateExpenseTrendAlert(person_id, home_id, type);
      const response = {
        balance: type === 'Personal' ? dataBalance.personal : dataBalance.home,
        statusFinance: status,
        suggestions: mappedSuggestions,
        statusuggestions: translatedSuggestionStatusData,
        financeData: financeData,
         dataSpent: {
          totalAmount: parseFloat(totalSpentType.toFixed(2)), // ✅ ¡AHORA ES INCOME!
          totalBudgetByGroup: spentByMainId,               // ✅ ¡AHORA ES GASTO POR GRUPO!
          currency: "CLP",
          dateRange: { start: null, end: null },
          summary,
          categories: parentCategories,
          details,
        },
        alertsBudget: alertsBudget,
        alertsSpent: expenseTrendAlert
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error("FinanceController->getPersonFinancialStats: " + error.message);
      res.status(500).json({ 
        error: "ServerError", 
        message: "Error al obtener estadísticas financieras personales" 
      });
    }
  },
  
  /**
 * Genera alertas si se está consumiendo el presupuesto demasiado rápido
 * @param {Array} parentCategories - Categorías principales (padres)
 * @param {Object} details - Detalles agrupados por mainId
 * @param {Object} budgetByMainId - Presupuesto total por categoría principal
 * @param {number} totalBudgetAll - Presupuesto total global
 * @param {string} type - Tipo: "Personal" o "Hogar"
 * @returns {Array|null} - Lista de alertas o null si no hay
 */
  generateSpendingAlerts(
    parentCategories,
    details,
    budgetByMainId,
    totalBudgetAll,
    type
  ) {
    const now = new Date();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const elapsedDays = now.getDate();
    const progressPercentage = (elapsedDays / totalDays) * 100;

    const SPENT_THRESHOLD = 70;   // Umbral para alertar
    const TIME_THRESHOLD = 50;    // No alertar si ya pasó más del 50% del mes

    if (progressPercentage >= TIME_THRESHOLD) {
      return null;
    }

    const alerts = [];

    // --- 1. Alerta por categoría principal (padre): la más crítica que supere el umbral ---
    let highestGroupUsage = SPENT_THRESHOLD;
    let criticalGroup = null;

    parentCategories.forEach((parent) => {
      const children = details[parent.id] || [];
      const totalSpent = children.reduce((sum, child) => sum + parseFloat(child.amount), 0);
      const totalBudget = budgetByMainId[parent.id] || 0;

      if (totalBudget > 0) {
        const usagePercentage = (totalSpent / totalBudget) * 100;
        if (usagePercentage > highestGroupUsage) {
          highestGroupUsage = usagePercentage;
          criticalGroup = {
            parent,
            usagePercentage,
          };
        }
      }
    });

    // Si encontramos una categoría principal crítica, agregamos la alerta
    if (criticalGroup) {
      alerts.push({
        type: "HIGH_SPENDING_RATE_GROUP",
        scope: type,
        category: {
          id: criticalGroup.parent.id,
          name: criticalGroup.parent.title,
          icon: criticalGroup.parent.icon,
          color: criticalGroup.parent.color,
        },
        message: `Estás gastando más rápido de lo esperado en la categoría "${criticalGroup.parent.title}". Considera revisar tus movimientos.`,
        severity: criticalGroup.usagePercentage > 90 ? "high" : "warning",
        usagePercentage: parseFloat(criticalGroup.usagePercentage.toFixed(1)),
        timeProgress: parseFloat(progressPercentage.toFixed(1)),
      });
    }

    // --- 2. Alerta por subcategoría individual: la MÁS crítica (mayor % usado) ---
    let mostCriticalItem = null;
    let highestItemUsage = SPENT_THRESHOLD;

    Object.values(details).flat().forEach(item => {
      const spent = parseFloat(item.amount);
      const budget = parseFloat(item.budget);

      if (budget > 0) {
        const usagePercentage = (spent / budget) * 100;
        if (usagePercentage > highestItemUsage) {
          highestItemUsage = usagePercentage;
          mostCriticalItem = item;
        }
      }
    });

    // Si hay una subcategoría crítica, agregamos la alerta
    if (mostCriticalItem) {
      alerts.push({
        type: "HIGH_SPENDING_RATE_ITEM",
        scope: type,
        category: {
          id: mostCriticalItem.id,
          name: mostCriticalItem.title,
          icon: mostCriticalItem.icon,
          color: mostCriticalItem.color,
        },
        message: `La categoría "${mostCriticalItem.title}" ya ha usado el ${highestItemUsage.toFixed(1)}% de su presupuesto.`,
        severity: highestItemUsage > 90 ? "high" : "warning",
        usagePercentage: parseFloat(highestItemUsage.toFixed(1)),
        timeProgress: parseFloat(progressPercentage.toFixed(1)),
      });
    }

    // --- Retornar null si no hay alertas, o máximo 2 ---
    return alerts.length > 0 ? alerts : null;
  },

  /**
 * Genera una alerta si una categoría tiene un aumento significativo en gastos
 * comparado con el mismo rango del mes anterior.
 *
 * @param {number} person_id
 * @param {number|null} home_id
 * @param {string} type - "Personal" o "Hogar"
 * @returns {Object|null} - Alerta o null si no aplica
 */
  async generateExpenseTrendAlert(person_id, home_id, type) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // --- Rango: desde el 1 hasta hoy del mes actual ---
  const startDateCurrent = new Date(year, month, 1);
  const endDateCurrent = new Date(now);
  endDateCurrent.setHours(23, 59, 59);

  // --- Rango del mes anterior: mismo día del mes pasado ---
  const previousMonth = month === 0 ? 11 : month - 1;
  const previousYear = month === 0 ? year - 1 : year;
  const startDatePrevious = new Date(previousYear, previousMonth, 1);
  const endDatePrevious = new Date(previousYear, previousMonth, now.getDate());
  endDatePrevious.setHours(23, 59, 59);

  // Ajustar si el día actual no existe en el mes anterior
  const lastDayPrevMonth = new Date(previousYear, previousMonth + 1, 0).getDate();
  if (now.getDate() > lastDayPrevMonth) {
    endDatePrevious.setDate(lastDayPrevMonth);
  }

  try {
    // Obtener gastos del rango actual
    const { expenses: expensesCurrent } = await FinanceRepository.getAllExpensesAndBudgetCategories(
      person_id,
      startDateCurrent,
      endDateCurrent,
      home_id,
      type
    );

    // Obtener gastos del mismo rango del mes anterior
    const { expenses: expensesPrevious } = await FinanceRepository.getAllExpensesAndBudgetCategories(
      person_id,
      startDatePrevious,
      endDatePrevious,
      home_id,
      type
    );

    // --- Validación: si no hay gastos en el mes actual → no hay nada que alertar
    if (!expensesCurrent || expensesCurrent.length === 0) {
      return null;
    }

    // --- Validación: si no hay gastos en el mes anterior → no hay base
    if (!expensesPrevious || expensesPrevious.length === 0) {
      return null;
    }

    // --- Validación CLAVE: debe haber al menos una categoría en común ---
    const currentCategories = new Set(expensesCurrent.map(e => e.categoryName));
    const previousCategories = new Set(expensesPrevious.map(e => e.categoryName));

    const hasCommonCategory = [...currentCategories].some(cat => previousCategories.has(cat));

    if (!hasCommonCategory) {
      return null; // No hay categorías comparables → no alertar
    }

    // Mapear por nombre de categoría
    const currentMap = {};
    expensesCurrent.forEach(exp => {
      const name = exp.categoryName;
      currentMap[name] = (currentMap[name] || 0) + (parseFloat(exp.total) || 0);
    });

    const previousMap = {};
    expensesPrevious.forEach(exp => {
      const name = exp.categoryName;
      previousMap[name] = (previousMap[name] || 0) + (parseFloat(exp.total) || 0);
    });

    // Encontrar la categoría con mayor aumento porcentual (solo si hay comparación)
    let maxGrowthRate = 0;
    let topCategory = null;
    const MIN_PERCENTAGE_CHANGE = 10;
    const MIN_ABSOLUTE_CHANGE = 5;

    Object.keys(currentMap).forEach(name => {
      const current = currentMap[name];
      const previous = previousMap[name] || 0;

      // Solo considerar si hubo gasto previo o es un salto significativo
      if (current <= previous * 1.05 && (current - previous) < MIN_ABSOLUTE_CHANGE) return;

      let growthRate = 0;
      if (previous > 0) {
        growthRate = ((current - previous) / previous) * 100;
      } else if (current >= MIN_ABSOLUTE_CHANGE) {
        growthRate = 100;
      }

      if (growthRate >= MIN_PERCENTAGE_CHANGE && growthRate > maxGrowthRate) {
        maxGrowthRate = growthRate;
        topCategory = { name, current, previous, growthRate };
      }
    });

    // Si no encontramos una categoría con crecimiento significativo
    if (!topCategory) {
      return null;
    }

    // Formatear alerta
    return {
      type: "EXPENSE_INCREASE_ALERT",
      scope: type,
      category: {
        name: topCategory.name,
      },
      message: `Este mes gastaste ${topCategory.growthRate.toFixed(1)}% más en "${topCategory.name}" que el mes anterior.`,
      severity: topCategory.growthRate > 50 ? "high" : "warning",
      growthRate: parseFloat(topCategory.growthRate.toFixed(1)),
      current: parseFloat(topCategory.current.toFixed(2)),
      previous: parseFloat(topCategory.previous.toFixed(2)),
    };

  } catch (error) {
    console.error("Error en generateExpenseTrendAlert:", error);
    return null;
  }
},
  async getFinacesData(req, res) {
    logger.info(`${req.user.name} - Datos para agregar finanzas`);
    const { home_id } = req.body;
    const person_id = req.person.id;
    if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          logger.error(`Hogar no encontrado con ID ${home_id}`);
          return res.status(404).json({ msg: "TypeNotFound" });
        }
      }

    try {
    const budgets = await BudgetRepository.findAllByPersonId(person_id, home_id);
    const dataBalance = await FinanceRepository.getAvailableMoneyCurrentMonth(home_id, person_id);
    const mappedBudgets = budgets.map((budget) => {
            const translatedCategory = i18n.__(`categories.${budget.category?.name}.name`) !== `categories.${budget.category?.name}.name`
              ? i18n.__(`categories.${budget.category?.name}.name`)
              : budget.category?.name;
    
            return {
              id: budget.id,
              person_id: budget.person_id,
              category_id: budget.category_id,
              type_id: budget.type_id,
              amount: budget.amount,
              used_amount: budget.used_amount,
              remaining_amount: budget.amount - budget.used_amount,
              start_date: budget.start_date,
              end_date: budget.end_date,
              budget_type: budget.budget_type,
              status: budget.status,
              description: budget.description,
              currency: budget.currency,
              categoryName: translatedCategory,
              icon: budget.category.icon,
              categoryOriginal: budget.category?.name,
              typeName: budget.type?.name ? 
                          (i18n.__(`types.${budget.type.name}.name`) !== `types.${budget.type.name}.name`
                              ? i18n.__(`types.${budget.type.name}.name`)
                              : budget.type.name)
                              : null,
                        type: budget.type?.name
            };
          });

     const financeTypeData = [
        { id: "Personal", name: "Personal", description: "Registro financiero personal" },
        { id: "Hogar", name: "Hogar", description: "Registro financiero del hogar" }
          ];

          const translatedFinanceTypeData = financeTypeData.map((item) => ({
        id: item.id,
        name: i18n.__(`financeType.${item.id}.name`) !== `financeType.${item.id}.name`
              ? i18n.__(`financeType.${item.id}.name`)
              : item.name,
        description: i18n.__(`financeType.${item.id}.description`) !== `financeType.${item.id}.description`
              ? i18n.__(`financeType.${item.id}.description`)
              : item.description,
        originalName: item.name
      }));

      res
        .status(200)
        .json({
          types: translatedFinanceTypeData,
          budgets: mappedBudgets,
          balance: dataBalance,
        });
    } catch (error) {
      logger.error("FinanceController->getFinacesData: " + error.message);
      res.status(500).json({ 
        error: "ServerError", 
        message: "Error al obtener estadísticas financieras personales" 
      });
    }
  },
  getFinancialStatus(percentage) {
    if (percentage <= 50) {
    return {
      level: 'excellent',
      levelLabel: 'Excelente',
      message: 'Ahorras y gastas de forma equilibrada',
      icon: 'mdi-emoticon-excited',
      color: 'teal'
    };
  } else if (percentage <= 75) {
    return {
      level: 'good',
      levelLabel: 'Bueno',
      message: 'Tienes control, con algunos ajustes posibles',
      icon: 'mdi-emoticon-happy',
      color: 'teal'
    };
  } else if (percentage <= 100) {
    return {
      level: 'acceptable',
      levelLabel: 'Aceptable',
      message: 'Tus gastos casi igualan tus ingresos',
      icon: 'mdi-emoticon-neutral',
      color: 'orange-darken-2'
    };
  } else if (percentage <= 150) {
    return {
      level: 'at-risk',
      levelLabel: 'En riesgo',
      message: 'Tus gastos superan lo que ganas',
      icon: 'mdi-alert',
      color: 'orange-darken-4'
    };
  } else {
    return {
      level: 'critical',
      levelLabel: 'Crítico',
      message: 'Alta probabilidad de problemas financieros',
      icon: 'mdi-alert-octagram',
      color: 'red-darken-3'
    };
  }
}
};

module.exports = FinanceController;
