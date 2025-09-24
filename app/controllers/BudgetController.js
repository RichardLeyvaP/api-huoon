const logger = require("../../config/logger");
const { BudgetRepository, CategoryRepository, HomeRepository, TypeRepository } = require("../repositories");
const i18n = require("../../config/i18n-config");
const { CategoryService } = require("../services");

const BudgetController = {
  /**
   * Obtener todos los presupuestos
   */
  async index(req, res) {
    logger.info(`${req.user.name} - Busca todos los presupuestos`);
    try {
      const budgets = await BudgetRepository.findAll();

      if (!budgets.length) {
        return res.status(204).json({ msg: "BudgetNotFound", budgets: [] });
      }

      // Mapear los presupuestos para el formato de respuesta
      const mappedBudgets = budgets.map((budget) => ({
        id: budget.id,
        person_id: budget.person_id,
        personId: budget.person_id,
        home_id: budget.home_id,
        homeId: budget.home_id,
        category_id: budget.category_id,
        categoryId: budget.category_id,
        type_id: budget.type_id,
        typeId: budget.type_id,
        amount: budget.amount,
        used_amount: budget.used_amount,
        remaining_amount: budget.amount - budget.used_amount,
        start_date: budget.start_date,
        end_date: budget.end_date,
        budget_type: budget.budget_type,
        status: budget.status,
        description: budget.description,
        currency: budget.currency,
        categoryName: budget.category?.name,
        personName: budget.person?.name,
        homeName: budget.home?.name,
        typeName: budget.type?.name ? 
            (i18n.__(`types.${budget.type.name}.name`) !== `types.${budget.type.name}.name`
                ? i18n.__(`types.${budget.type.name}.name`)
                : budget.type.name)
                : null,
        type: budget.tipe?.name
      }));

      return res.status(200).json({ budgets: mappedBudgets });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("BudgetController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener un presupuesto por su ID
   */
  async show(req, res) {
    logger.info(`${req.user.name} - Busca un presupuesto`);
    try {
      const { id } = req.params;

      const budget = await BudgetRepository.findById(id);

      if (!budget) {
        return res.status(204).json({ msg: "BudgetNotFound" });
      }

      // Mapear el presupuesto para el formato de respuesta
      const mappedBudget = {
        id: budget.id,
        person_id: budget.person_id,
        personId: budget.person_id,
        home_id: budget.home_id,
        homeId: budget.home_id,
        category_id: budget.category_id,
        categoryId: budget.category_id,
        type_id: budget.type_id,
        typeId: budget.type_id,
        amount: budget.amount,
        used_amount: budget.used_amount,
        remaining_amount: budget.amount - budget.used_amount,
        start_date: budget.start_date,
        end_date: budget.end_date,
        budget_type: budget.budget_type,
        status: budget.status,
        description: budget.description,
        currency: budget.currency,
        categoryName: budget.category?.name,
        personName: budget.person?.name,
        homeName: budget.home?.name,
        typeName: budget.type?.name ? 
            (i18n.__(`types.${budget.type.name}.name`) !== `types.${budget.type.name}.name`
                ? i18n.__(`types.${budget.type.name}.name`)
                : budget.type.name)
                : null,
        type: budget.tipe?.name
      };

      return res.status(200).json({ budget: mappedBudget });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("BudgetController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener presupuestos por ID de persona
   */
  async getByPersonId(req, res) {
    logger.info(`${req.user.name} - Busca presupuestos de una persona`);
    try {
      const { home_id, type } = req.body;
      const personId = req.person.id;

      const budgets = await BudgetRepository.findAllByPersonId(personId, home_id, type);

      if (!budgets.length) {
        return res.status(204).json({ msg: "BudgetNotFound", budgets: [] });
      }

      // Mapear con traducción de nombres de categoría si es necesario
      const mappedBudgets = budgets.map((budget) => {
        const translatedCategory = i18n.__(`categories.${budget.category?.name}.name`) !== `categories.${budget.category?.name}.name`
          ? i18n.__(`categories.${budget.category?.name}.name`)
          : budget.category?.name;

          const type = i18n.__(`financeType.${budget.budget_type}.name`) !== `financeType.${budget.budget_type}.name`
              ? i18n.__(`financeType.${budget.budget_type}.name`)
              : budget.budget_type;

        return {
          id: budget.id,
          person_id: budget.person_id,
          category_id: budget.category_id,
          type_id: budget.type_id,
          typeId: budget.type_id,
          amount: budget.amount,
          used_amount: budget.used_amount,
          remaining_amount: budget.amount - budget.used_amount,
          start_date: budget.start_date,
          end_date: budget.end_date,
          budget_type: budget.budget_type,
          budgetTypeTranslate: type,
          status: budget.status,
          description: budget.description,
          currency: budget.currency,
          categoryName: translatedCategory,
          categoryOriginal: budget.category?.name,
          typeName: budget.type?.name ? 
            (i18n.__(`types.${budget.type.name}.name`) !== `types.${budget.type.name}.name`
                ? i18n.__(`types.${budget.type.name}.name`)
                : budget.type.name)
                : null,
          type: budget.type?.name
        };
      });

      return res.status(200).json({ budgets: mappedBudgets });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("BudgetController->getByPersonId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener presupuestos por ID de hogar
   */
  async getByHomeId(req, res) {
    logger.info(`${req.user.name} - Busca presupuestos de un hogar`);
    try {
      const homeId = req.params.homeId;

      const budgets = await BudgetRepository.findAllByHomeId(homeId);

      if (!budgets.length) {
        return res.status(204).json({ msg: "BudgetNotFound", budgets: [] });
      }

      const mappedBudgets = budgets.map((budget) => {
        const translatedCategory = i18n.__(`categories.${budget.category?.name}.name`) !== `categories.${budget.category?.name}.name`
          ? i18n.__(`categories.${budget.category?.name}.name`)
          : budget.category?.name;

        return {
          id: budget.id,
          home_id: budget.home_id,
          category_id: budget.category_id,
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
          categoryOriginal: budget.category?.name,
          typeName: budget.type?.name ? 
            (i18n.__(`types.${budget.type.name}.name`) !== `types.${budget.type.name}.name`
                ? i18n.__(`types.${budget.type.name}.name`)
                : budget.type.name)
                : null,
        type: budget.tipe?.name
        };
      });

      return res.status(200).json({ budgets: mappedBudgets });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("BudgetController->getByHomeId: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener presupuestos por categoría
   */
  async getByCategory(req, res) {
    logger.info(`${req.user.name} - Busca presupuestos por categoría`);
    try {
      const { categoryId } = req.params;
      const options = {};
      
      // Determinar si es búsqueda por persona o hogar
      if (req.person?.id) {
        options.personId = req.person.id;
      } else if (req.query.homeId) {
        options.homeId = req.query.homeId;
      }

      const budgets = await BudgetRepository.findByCategory(categoryId, options);

      if (!budgets.length) {
        return res.status(204).json({ msg: "BudgetNotFound", budgets: [] });
      }

      const mappedBudgets = budgets.map(budget => ({
        id: budget.id,
        amount: budget.amount,
        used_amount: budget.used_amount,
        remaining_amount: budget.amount - budget.used_amount,
        start_date: budget.start_date,
        end_date: budget.end_date,
        status: budget.status,
        budget_type: budget.budget_type,
        person_id: budget.person_id,
        home_id: budget.home_id,
        category_id: budget.category_id,
        categoryName: budget.category?.name,
        typeName: budget.type?.name ? 
            (i18n.__(`types.${budget.type.name}.name`) !== `types.${budget.type.name}.name`
                ? i18n.__(`types.${budget.type.name}.name`)
                : budget.type.name)
                : null,
        type: budget.tipe?.name
      }));

      return res.status(200).json({ budgets: mappedBudgets });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("BudgetController->getByCategory: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener presupuestos por estado
   */
  async getByStatus(req, res) {
    logger.info(`${req.user.name} - Busca presupuestos por estado`);
    try {
      const { status } = req.params;
      const options = {};
      
      if (req.person?.id) {
        options.personId = req.person.id;
      } else if (req.query.homeId) {
        options.homeId = req.query.homeId;
      }

      const budgets = await BudgetRepository.findByStatus(status, options);

      if (!budgets.length) {
        return res.status(204).json({ msg: "BudgetNotFound", budgets: [] });
      }

      const mappedBudgets = budgets.map(budget => ({
        id: budget.id,
        amount: budget.amount,
        used_amount: budget.used_amount,
        remaining_amount: budget.amount - budget.used_amount,
        start_date: budget.start_date,
        end_date: budget.end_date,
        status: budget.status,
        budget_type: budget.budget_type,
        category_id: budget.category_id,
        categoryName: budget.category?.name,
        typeName: budget.type?.name ? 
            (i18n.__(`types.${budget.type.name}.name`) !== `types.${budget.type.name}.name`
                ? i18n.__(`types.${budget.type.name}.name`)
                : budget.type.name)
                : null,
        type: budget.tipe?.name
      }));

      return res.status(200).json({ budgets: mappedBudgets });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("BudgetController->getByStatus: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener presupuestos por rango de fechas
   */
  async getByDateRange(req, res) {
    logger.info(`${req.user.name} - Busca presupuestos por rango de fechas`);
    try {
      const { startDate, endDate } = req.params;
      const options = {};
      
      if (req.person?.id) {
        options.personId = req.person.id;
      } else if (req.query.homeId) {
        options.homeId = req.query.homeId;
      }

      const budgets = await BudgetRepository.findByDateRange(startDate, endDate, options);

      if (!budgets.length) {
        return res.status(204).json({ msg: "BudgetNotFound", budgets: [] });
      }

      const mappedBudgets = budgets.map(budget => ({
        id: budget.id,
        amount: budget.amount,
        used_amount: budget.used_amount,
        remaining_amount: budget.amount - budget.used_amount,
        start_date: budget.start_date,
        end_date: budget.end_date,
        status: budget.status,
        budget_type: budget.budget_type,
        category_id: budget.category_id,
        categoryName: budget.category?.name,
        typeName: budget.type?.name ? 
            (i18n.__(`types.${budget.type.name}.name`) !== `types.${budget.type.name}.name`
                ? i18n.__(`types.${budget.type.name}.name`)
                : budget.type.name)
                : null,
        type: budget.tipe?.name
      }));

      return res.status(200).json({ budgets: mappedBudgets });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("BudgetController->getByDateRange: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener el presupuesto actual para una categoría
   */
  async getCurrentBudget(req, res) {
    logger.info(`${req.user.name} - Busca presupuesto actual para categoría`);
    try {
      const { categoryId } = req.params;
      const options = {};
      
      if (req.person?.id) {
        options.personId = req.person.id;
      } else if (req.query.homeId) {
        options.homeId = req.query.homeId;
      }

      const budget = await BudgetRepository.getCurrentBudget(categoryId, options);

      if (!budget) {
        return res.status(204).json({ msg: "BudgetNotFound" });
      }

      const mappedBudget = {
        id: budget.id,
        amount: budget.amount,
        used_amount: budget.used_amount,
        remaining_amount: budget.amount - budget.used_amount,
        start_date: budget.start_date,
        end_date: budget.end_date,
        status: budget.status,
        budget_type: budget.budget_type,
        category_id: budget.category_id,
        categoryName: budget.category?.name,
        typeName: budget.type?.name ? 
            (i18n.__(`types.${budget.type.name}.name`) !== `types.${budget.type.name}.name`
                ? i18n.__(`types.${budget.type.name}.name`)
                : budget.type.name)
                : null,
        type: budget.tipe?.name
      };

      return res.status(200).json({ budget: mappedBudget });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("BudgetController->getCurrentBudget: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Crear un nuevo presupuesto
   */
  async store(req, res) {
    logger.info(`${req.user.name} - Crea un nuevo presupuesto`);
      logger.info("datos recibidos al crear un presupuesto");
    logger.info(JSON.stringify(req.body));

    try {
      const { category_id, home_id, type_id } = req.body;

      // Asignar person_id si no es presupuesto de hogar

        req.body.person_id = req.person.id;


      // Verificar si la categoría existe
      const category = await CategoryRepository.findById(category_id);
      if (!category) {
        logger.error(`Categoría no encontrada con ID ${category_id}`);
        return res.status(404).json({ msg: "CategoryNotFound" });
      }

      // Verificar si el hogar existe (si se proporciona)
      if (home_id) {
        const home = await HomeRepository.findById(home_id);
        if (!home) {
          logger.error(`Hogar no encontrado con ID ${home_id}`);
          return res.status(404).json({ msg: "HomeNotFound" });
        }
      }

      if (type_id) {
      const type = await TypeRepository.findById(type_id);
      if (!type) {
        logger.error(`Type not found with ID ${type_id}`);
        return res.status(404).json({ msg: "TypeNotFound" });
      }
    }

      const budget = await BudgetRepository.create(req.body);
      res.status(201).json({ budget });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("BudgetController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Actualizar un presupuesto existente
   */
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza presupuesto con ID ${req.body.id}`);
    logger.info("Datos recibidos:", JSON.stringify(req.body));

    const { id, category_id, type_id } = req.body;

    try {
      const budget = await BudgetRepository.findById(id);

      if (!budget) {
        return res.status(404).json({ msg: "BudgetNotFound" });
      }

      // Verificar categoría si se está actualizando
      if (category_id) {
        const category = await CategoryRepository.findById(category_id);
        if (!category) {
          logger.error(`Categoría no encontrada con ID ${category_id}`);
          return res.status(404).json({ msg: "CategoryNotFound" });
        }
      }

      if (type_id) {
      const type = await TypeRepository.findById(type_id);
      if (!type) {
        logger.error(`Type not found with ID ${type_id}`);
        return res.status(404).json({ msg: "TypeNotFound" });
      }
    }
      const updatedBudget = await BudgetRepository.update(budget, req.body);
      res.status(200).json({ budget: updatedBudget });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("BudgetController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Eliminar un presupuesto
   */
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina presupuesto con ID ${req.body.id}`);

    const { id } = req.body;

    try {
      const budget = await BudgetRepository.findById(id);

      if (!budget) {
        return res.status(404).json({ msg: "BudgetNotFound" });
      }

      await BudgetRepository.delete(budget);
      res.status(200).json({ msg: "BudgetDeleted" });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("BudgetController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Agregar monto utilizado a un presupuesto
   */
  async addExpense(req, res) {
    logger.info(`${req.user.name} - Agrega gasto a presupuesto con ID ${req.params.id}`);
    logger.info("Monto:", req.body.amount);

    const { id } = req.params;
    const { amount } = req.body;

    try {
      const budget = await BudgetRepository.addUsedAmount(id, amount);
      res.status(200).json({ 
        budget,
        message: "ExpenseAdded",
        details: `Se agregó ${amount} al monto utilizado del presupuesto`
      });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("BudgetController->addExpense: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /**
   * Obtener tipos de presupuesto y categorías disponibles
   */
  async getBudgetTypesAndCategories(req, res) {
    logger.info(`${req.user.name} - Buscando tipos de presupuesto y categorías`);

    try {
      // Obtener todas las categorías
      const categories = await CategoryRepository.findAll();

      // Formatear categorías con traducción
      const formattedCategories = categories.map((category) => {
        const translatedName = i18n.__(`categories.${category.name}.name`) !== `categories.${category.name}.name`
          ? i18n.__(`categories.${category.name}.name`)
          : category.name;

        const translatedDescription = i18n.__(`categories.${category.name}.description`) !== `categories.${category.name}.description`
          ? i18n.__(`categories.${category.name}.description`)
          : category.description;

        return {
          ...category.toJSON(),
          nameTranslated: translatedName,
          descriptionTranslated: translatedDescription,
        };
      });

      // Datos de tipos de presupuesto
      const budgetTypesData = [
        { id: "Personal", name: "Personal", description: "Presupuesto personal" },
        { id: "Hogar", name: "Hogar", description: "Presupuesto del hogar" }
      ];

      // Traducir tipos de presupuesto
      const translatedBudgetTypes = budgetTypesData.map((item) => ({
        id: item.id,
        name: i18n.__(`budgetTypes.${item.id}.name`) !== `budgetTypes.${item.id}.name`
              ? i18n.__(`budgetTypes.${item.id}.name`)
              : item.name,
        description: i18n.__(`budgetTypes.${item.id}.description`) !== `budgetTypes.${item.id}.description`
              ? i18n.__(`budgetTypes.${item.id}.description`)
              : item.description,
        originalName: item.name
      }));

      // Datos de estados de presupuesto
      const budgetStatusesData = [
        { id: "active", name: "Activo", description: "Presupuesto activo" },
        { id: "inactive", name: "Inactivo", description: "Presupuesto inactivo" },
        { id: "completed", name: "Completado", description: "Presupuesto completado" },
        { id: "exceeded", name: "Excedido", description: "Presupuesto excedido" }
      ];

      // Traducir estados de presupuesto
      const translatedBudgetStatuses = budgetStatusesData.map((item) => ({
        id: item.id,
        name: i18n.__(`budgetStatuses.${item.id}.name`) !== `budgetStatuses.${item.id}.name`
              ? i18n.__(`budgetStatuses.${item.id}.name`)
              : item.name,
        description: i18n.__(`budgetStatuses.${item.id}.description`) !== `budgetStatuses.${item.id}.description`
              ? i18n.__(`budgetStatuses.${item.id}.description`)
              : item.description,
        originalName: item.name
      }));

      return res.status(200).json({ 
        categories: formattedCategories, 
        budgetTypes: translatedBudgetTypes,
        budgetStatuses: translatedBudgetStatuses
      });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error("BudgetController->getBudgetTypesAndCategories: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async category_budgets(req, res) {
    logger.info(`${req.user.name} - Entra a la ruta unificada de presupuesto`);
    // Verificar si el hogar existe
    /*const home = await HomeRepository.findById(req.body.home_id);
    if (!home) {
      logger.error(
        `TaskController->category_status_priority: Hogar no encontrado con ID ${req.body.home_id}`
      );
      return res.status(400).json({ msg: "HomeNotFound" });
    }*/

    // Obtén el ID de la persona autenticada
    const personId = req.person.id;
    // Establecer el idioma de i18n dinámicamente
    if (!personId) {
      return res.status(400).json({ error: "Persona no encontrada" });
    }
    try {
      const categories = await CategoryService.getCategories(personId, "Budget"); //const categories = await TaskController.getCategories(personId);
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
      /*const statuses = await StatusService.getStatus("Task");
      const priorities = await TaskController.getPriorities();
      const people = await TaskController.getPeople(req.body.home_id); //await TaskController.getPeople(value.home_id);
      const roles = await RoleService.getRoles("Task");
      const recurrenceData = [
        { id: "Diaria", name: "Diaria" },
        { id: "Semanal", name: "Semanal" },
        { id: "Mensual", name: "Mensual" },
        { id: "Anual", name: "Anual" },
        { id: "No se repite", name: "No se repite" },
      ];

      const translatedRecurrenceData = recurrenceData.map((item) => {
        return {
          id: item.id, // El identificador único
          name: i18n.__(`recurrence.${item.name}.name`), // La traducción del nombre
          recurrenceName: item.name,
        };
      });

      const typeTaskData = [
        { id: "Tarea", name: "Tarea" },
        { id: "Evento", name: "Evento" },
      ];

      const translatedTypeTaskData = typeTaskData.map((item) => {
        return {
          id: item.id, // El identificador
          name: i18n.__(`typetask.${item.name}.name`), // El nombre traducido
        };
      });*/
      const types = await TypeRepository.findByType('Presupuesto');

      const formattedTypes = types.map((typeItem) => {
        const translatedName = i18n.__(`types.${typeItem.name}.name`) !== `types.${typeItem.name}.name`
          ? i18n.__(`types.${typeItem.name}.name`)
          : typeItem.name;

        const translatedDescription = i18n.__(`types.${typeItem.name}.description`) !== `types.${typeItem.name}.description`
          ? i18n.__(`types.${typeItem.name}.description`)
          : typeItem.description;

        return {
          ...typeItem.toJSON(),
          nameTranslated: translatedName,
          descriptionTranslated: translatedDescription,
        };
      });
      res.json({
        categories: categories,
        types: translatedFinanceTypeData,
        typesPeriodo: formattedTypes
        /*taskpriorities: priorities,
        taskpeople: people,
        taskrecurrences: translatedRecurrenceData,
        taskroles: roles,
        tasktype: translatedTypeTaskData,*/
      });
    } catch (error) {
      logger.error("Error al obtener categorías:", error);
      res.status(500).json({ error: "Error al obtener categorías" });
    }
  },
};

module.exports = BudgetController;