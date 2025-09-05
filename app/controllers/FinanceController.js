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
        if (type === 'Hogar') {
            finances = await FinanceRepository.findAllTypeRange(home_id, null, type, dateRange);
        } else if (type === 'Personal') {
            finances = await FinanceRepository.findAllTypeRange(person_id, null, type, dateRange);
        } else {
            finances = await FinanceRepository.findAllTypeRange(person_id, home_id, type, dateRange);
        }

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
      budget_id
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
      res.status(201).json({ finance });
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
      res.status(200).json({ finance: financeUpdate });
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
      const budgetStats = await BudgetRepository.getPersonBudgetStats(person_id, home_id, type);
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

      // Obtener descripción del último movimiento (si existe)
      /*let lastMovementDescription = "No hay movimientos";
      if (stats.lastRecord) {
        lastMovementDescription = stats.lastRecord.description || 
          (stats.lastRecord.income ? "Ingreso registrado" : "Gasto registrado");
      }*/

      //Grafico de pie
      // Estructura: agrupar por categoría principal y sus subcategorías
      
      /*const { expenses, categories } = await FinanceRepository.getAllExpensesByCategory( person_id, null, null);
      const categoriesMap = new Map();

      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.id] = cat;
      });

      // Traducción
      const translateCategory = (name, state) => {
        if (!name) return "Sin nombre";
        if (state === 1) {
          const translated = i18n.__(`category.${name}.name`);
          return translated !== `category.${name}.name` ? translated : name;
        }
        return name;
      };

      let totalAll = 0;

      // Procesar gastos
      const processed = expenses.map(exp => {
        const categoryId = parseInt(exp.categoryId);
        const parentId = exp.parentId;
        const spent = parseFloat(exp.total);
        const mainId = parentId !== null ? parentId : categoryId;

        totalAll += spent;

        const categoryName = categoryMap[categoryId]?.name || exp.categoryName;
        const state = categoryMap[categoryId]?.state || exp.state;
        const color = categoryMap[categoryId]?.color || exp.color;

        return {
          id: categoryId,
          name: translateCategory(categoryName, state),
          color: color,
          parentId,
          mainId,
          spent,
          state,
        };
      });

      // Asegurar que todos los mainId tengan su categoría padre en `processed`
      const allParentIds = [...new Set(processed.map(p => p.mainId))];

      allParentIds.forEach(mainId => {
        if (isNaN(mainId) || mainId === null) return;

        const exists = processed.some(p => p.id === mainId);
        if (!exists && categoryMap[mainId]) {
          const cat = categoryMap[mainId];
          processed.push({
            id: cat.id,
            name: translateCategory(cat.name, cat.state),
            color: cat.color || "rgba(var(--v-theme-on-surface), .2)",
            parentId: cat.parent_id,
            mainId: cat.id,
            spent: 0,
            state: cat.state,
          });
        }
      });

      // Agrupar detalles por categoría principal
      const details = {};
      processed.forEach(item => {
        if (!details[item.mainId]) {
          details[item.mainId] = [];
        }
        details[item.mainId].push(item);
      });

      // Categorías principales (sin padre)
      const mainCategories = processed
        .filter(item => item.parentId === null)
        .map(item => ({
          id: item.id,
          title: item.name,
          value: item.id,
          color: item.color || "rgba(var(--v-theme-on-surface), .2)",
        }));

      // Resumen: porcentaje por categoría principal
      const summary = mainCategories.map(cat => {
        const children = details[cat.id] || [];
        const totalCat = children.reduce((sum, child) => sum + child.spent, 0);
        const percentage = totalAll > 0 ? ((totalCat / totalAll) * 100).toFixed(1) : 0;

        return {
          id: cat.id,
          title: cat.title,
          value: parseFloat(percentage),
          color: cat.color,
          total: totalCat.toFixed(2),
        };
      });

      // Formatear detalles (para subcategorías)
      Object.keys(details).forEach(key => {
  const mainId = parseInt(key);
  if (isNaN(mainId)) return;

  const children = details[mainId].filter(item => item.id !== mainId);

  details[mainId] = children.map(item => {
    const percentage = totalAll > 0 ? ((item.spent / totalAll) * 100).toFixed(1) : 0;
    return {
      id: item.id,
      title: item.name,
      value: parseFloat(percentage),
      color: item.color || "rgba(var(--v-theme-on-surface), .2)",
      amount: item.spent.toFixed(2),
    };
  });
});*/
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
      const budgetByMainId = {};
      parentCategories.forEach(parent => {
        const children = details[parent.id] || [];
        const totalBudget = children.reduce((sum, child) => sum + child.budgetAmount, 0);
        budgetByMainId[parent.id] = totalBudget;
      });

      // Total global
      const totalBudgetAll = Object.values(budgetByMainId).reduce((sum, b) => sum + b, 0);

      // --- Generar summary ---
      const summary = parentCategories.map(parent => {
        const children = details[parent.id] || [];
        const totalSpent = children.reduce((sum, child) => sum + child.spent, 0);
        const totalBudget = budgetByMainId[parent.id] || 0;
        const percentage = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

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
        const totalBudgetMain = budgetByMainId[mainId] || 0;

        details[mainId] = items.map(item => {
          const percentage = totalBudgetMain > 0 ? ((item.spent / totalBudgetMain) * 100).toFixed(1) : 0;
          return {
            id: item.id,
            title: item.name, // ← nombre correcto
            value: parseFloat(percentage),
            color: item.color,
            icon: item.icon,
            amount: item.spent.toFixed(2),
            budget: item.budgetAmount.toFixed(2),
          };
        });
      });

      const response = {
        /*incomeCard: {
          current: formatCurrency(stats.currentMonth.income),
          percentage: stats.percentages.income,
          lastMonth: formatCurrency(stats.lastMonth.income),
          icon: "mdi-cash",
          color: "green"
        },
        spentCard: {
          current: formatCurrency(stats.currentMonth.spent),
          percentage: stats.percentages.spent,
          lastMonth: formatCurrency(stats.lastMonth.spent),
          icon: "mdi-cart",
          color: "red"
        },
        balanceCard: {
          current: formatCurrency(stats.currentMonth.balance),
          icon: "mdi-scale-balance",
          color: "blue-darken-2"
        },*/
        budgetCard: {
        current: formatCurrency(budgetStats.currentMonth.budget),
        used: formatCurrency(budgetStats.currentMonth.used),
        remaining: formatCurrency(budgetStats.currentMonth.remaining),
        currentUsage: budgetStats.currentMonth.usagePercentage, // % usado este mes
        lastUsage: budgetStats.lastMonth.usagePercentage,      // % usado mes anterior
        lastMonth: formatCurrency(budgetStats.lastMonth.budget),
        icon: "mdi-wallet",
        color: "blue"
      },
        /*movementsCard: {
          total: formatCurrency(stats.currentMonth.income - stats.currentMonth.spent),
          lastMovement: {
            amount: stats.lastRecord ? formatCurrency(stats.lastRecord.income || stats.lastRecord.spent) : "0",
            description: lastMovementDescription,
            icon: stats.lastRecord?.income ? "mdi-cash" : "mdi-cart",
            type: stats.lastRecord?.income ? "income" : "spent"
          },
          icon: "mdi-calendar-clock",
          color: "amber-darken-2"
        },*/
        suggestions: mappedSuggestions,
        statusuggestions: translatedSuggestionStatusData,
        financeData: financeData,
         /*dataSpent: {
          totalAmount: parseFloat(totalAll.toFixed(2)),
          currency: "USD",
          dateRange: {
            start: null,
            end: null,
          },
          summary,
          categories: mainCategories,
          details,
        },*/
         dataSpent: {
          totalAmount: parseFloat(totalBudgetAll.toFixed(2)), // total global
          totalBudgetByGroup: budgetByMainId,                 // 👈 nuevo: para que el frontend calcule dinámicamente
          currency: "USD",
          dateRange: { start: null, end: null },
          summary,
          categories: parentCategories,
          details,
        },
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

      res.status(200).json({'types': translatedFinanceTypeData, 'budgets': mappedBudgets});
    } catch (error) {
      logger.error("FinanceController->getFinacesData: " + error.message);
      res.status(500).json({ 
        error: "ServerError", 
        message: "Error al obtener estadísticas financieras personales" 
      });
    }
  }
};

module.exports = FinanceController;
