const { Op } = require("sequelize");
const { Budget, Person, Home, Category } = require("../models");
const logger = require("../../config/logger");

const BudgetRepository = {
  /**
   * Obtener todos los presupuestos con sus relaciones
   */
  async findAll() {
    return await Budget.findAll({
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        { model: Category, as: "category" },
      ],
      order: [['start_date', 'DESC']]
    });
  },

  /**
   * Obtener presupuestos por ID de persona
   * @param {number} personId - ID de la persona
   */
  /*async findAllByPersonId(personId) {
    return await Budget.findAll({
      where: { 
        person_id: personId,
        budget_type: 'Personal'
      },
      include: [
        { model: Person, as: "person" },
        { model: Category, as: "category" },
      ],
      order: [['start_date', 'DESC']]
    });
  },*/
  async findAllByPersonId(personId, homeId = null) {
    const whereConditions = {
      [Op.or]: [
        { person_id: personId, budget_type: 'Personal' }
      ]
    };

    if (homeId) {
      whereConditions[Op.or].push({
        home_id: homeId,
        budget_type: 'Hogar'
      });
    }

    return await Budget.findAll({
      where: whereConditions,
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        { model: Category, as: "category" },
      ],
      order: [
        ['budget_type', 'ASC'],
        ['start_date', 'DESC']
      ]
    });
  },

  async findAllCurrentByPersonId(personId, homeId = null) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const whereConditions = {
      [Op.and]: [
        { 
          [Op.or]: [
            { person_id: personId, budget_type: 'Personal' }
          ]
        },
        {
          start_date: { [Op.lte]: currentMonthEnd },
          end_date: { [Op.gte]: currentMonthStart }
        }
      ]
    };

    if (homeId) {
      whereConditions[Op.and][0][Op.or].push({
        home_id: homeId,
        budget_type: 'Hogar'
      });
    }

    return await Budget.findAll({
      where: whereConditions,
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        { model: Category, as: "category" },
      ],
      order: [
        ['budget_type', 'ASC'],
        ['start_date', 'DESC']
      ]
    });
},
  /**
   * Obtener presupuestos por ID de hogar
   * @param {number} homeId - ID del hogar
   */
  async findAllByHomeId(homeId) {
    return await Budget.findAll({
      where: { 
        home_id: homeId,
        budget_type: 'Hogar'
      },
      include: [
        { model: Home, as: "home" },
        { model: Category, as: "category" },
      ],
      order: [['start_date', 'DESC']]
    });
  },

  /**
   * Obtener un presupuesto por su ID
   * @param {number} id - ID del presupuesto
   */
  async findById(id) {
    return await Budget.findByPk(id, {
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        { model: Category, as: "category" },
      ]
    });
  },

  /**
   * Crear un nuevo presupuesto
   * @param {object} body - Datos del presupuesto
   * @param {object} t - Transacción de Sequelize (opcional)
   */
  async create(body, t = null) {
    try {
      // Validar que solo se proporcione person_id o home_id
 
      const budget = await Budget.create(
        {
          person_id: body.person_id,
          home_id: body.home_id || null,
          category_id: body.category_id,
          amount: body.amount,
          used_amount: body.used_amount || 0,
          start_date: body.start_date,
          end_date: body.end_date,
          budget_type: body.budget_type || 'Personal',
          status: body.status || 'Activo',
          description: body.description || null,
          currency: body.currency || 'USD'
        },
        { transaction: t }
      );
      
      logger.info(`Presupuesto creado exitosamente (ID: ${budget.id})`);
      return budget;
    } catch (err) {
      logger.error(`Error en BudgetRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar un presupuesto existente
   * @param {object} budget - Instancia del presupuesto
   * @param {object} body - Datos actualizados
   * @param {object} t - Transacción de Sequelize (opcional)
   */
  async update(budget, body, t = null) {
    // Lista de campos permitidos para actualizar
    const fieldsToUpdate = [
      "category_id",
      "amount",
      "used_amount",
      "start_date",
      "end_date",
      "status",
      "description",
      "currency"
    ];

    try {
      // Validar fechas si se actualizan
      if (body.start_date && body.end_date && new Date(body.start_date) > new Date(body.end_date)) {
        throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
      }

      // Filtrar campos en body y construir el objeto updatedData
      const updatedData = Object.keys(body)
        .filter((key) => fieldsToUpdate.includes(key) && body[key] !== undefined)
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      // Actualizar solo si hay datos para cambiar
      if (Object.keys(updatedData).length > 0) {
        await budget.update(updatedData, { transaction: t });
        logger.info(`Presupuesto actualizado exitosamente (ID: ${budget.id})`);
      }

      return budget;
    } catch (err) {
      logger.error(`Error en BudgetRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar un presupuesto
   * @param {object} budget - Instancia del presupuesto
   * @param {object} t - Transacción de Sequelize (opcional)
   */
  async delete(budget, t = null) {
    try {
      await budget.destroy({ transaction: t });
      logger.info(`Presupuesto eliminado exitosamente (ID: ${budget.id})`);
    } catch (err) {
      logger.error(`Error en BudgetRepository->delete: ${err.message}`);
      throw err;
    }
  },

  /**
   * Obtener presupuestos por categoría
   * @param {number} categoryId - ID de la categoría
   * @param {object} options - Opciones adicionales (personId o homeId)
   */
  async findByCategory(categoryId, options = {}) {
    const where = { category_id: categoryId };
    
    if (options.personId) {
      where.person_id = options.personId;
      where.budget_type = 'Personal';
    } else if (options.homeId) {
      where.home_id = options.homeId;
      where.budget_type = 'Hogar';
    }

    return await Budget.findAll({
      where,
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        { model: Category, as: "category" },
      ],
      order: [['start_date', 'DESC']]
    });
  },

  /**
   * Obtener presupuestos por estado
   * @param {string} status - Estado del presupuesto
   * @param {object} options - Opciones adicionales (personId o homeId)
   */
  async findByStatus(status, options = {}) {
    const where = { status };
    
    if (options.personId) {
      where.person_id = options.personId;
      where.budget_type = 'Personal';
    } else if (options.homeId) {
      where.home_id = options.homeId;
      where.budget_type = 'Hogar';
    }

    return await Budget.findAll({
      where,
      include: [
        { model: Category, as: "category" },
      ],
      order: [['start_date', 'DESC']]
    });
  },

  /**
   * Obtener presupuestos por rango de fechas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {object} options - Opciones adicionales (personId o homeId)
   */
  async findByDateRange(startDate, endDate, options = {}) {
    const where = {
      start_date: { [Op.gte]: startDate },
      end_date: { [Op.lte]: endDate }
    };
    
    if (options.personId) {
      where.person_id = options.personId;
      where.budget_type = 'Personal';
    } else if (options.homeId) {
      where.home_id = options.homeId;
      where.budget_type = 'Hogar';
    }

    return await Budget.findAll({
      where,
      include: [
        { model: Category, as: "category" },
      ],
      order: [['start_date', 'DESC']]
    });
  },

  /**
   * Actualizar el monto utilizado de un presupuesto
   * @param {number} budgetId - ID del presupuesto
   * @param {number} amount - Monto a sumar al utilizado
   * @param {object} t - Transacción de Sequelize (opcional)
   */
  async addUsedAmount(budgetId, amount, t = null) {
    try {
      const budget = await Budget.findByPk(budgetId);
      if (!budget) {
        throw new Error("Presupuesto no encontrado");
      }

      const newUsedAmount = parseFloat(budget.used_amount) + parseFloat(amount);
      await budget.update({ used_amount: newUsedAmount }, { transaction: t });

      // Actualizar estado si se excede el presupuesto
      if (newUsedAmount > budget.amount) {
        await budget.update({ status: 'Excedido' }, { transaction: t });
      }

      return budget;
    } catch (err) {
      logger.error(`Error en BudgetRepository->addUsedAmount: ${err.message}`);
      throw err;
    }
  },

  /**
   * Obtener el presupuesto actual (activo) para una categoría específica
   * @param {number} categoryId - ID de la categoría
   * @param {object} options - Opciones adicionales (personId o homeId)
   */
  async getCurrentBudget(categoryId, options = {}) {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const where = {
      category_id: categoryId,
      start_date: { [Op.lte]: currentDate },
      end_date: { [Op.gte]: currentDate },
      status: 'Activo'
    };
    
    if (options.personId) {
      where.person_id = options.personId;
      where.budget_type = 'Personal';
    } else if (options.homeId) {
      where.home_id = options.homeId;
      where.budget_type = 'Hogar';
    }

    return await Budget.findOne({
      where,
      include: [
        { model: Category, as: "category" },
      ]
    });
  }
};

module.exports = BudgetRepository;