const { Op } = require("sequelize");
const { Budget, Person, Home, Category, Type, Finance, sequelize } = require("../models");
const logger = require("../../config/logger");
const FinanceRepository = require("./FinanceRepository");
const TypeRepository = require("./TypeRepository");

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
        { model: Type, as: "type" },
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
    // 1. Obtener los tipos de presupuesto válidos
    const validTypes = await TypeRepository.findByType('Presupuesto');
  const validTypeMap = new Map(validTypes.map(t => [t.id, t.name]));

  // 2. Obtener los presupuestos con sus relaciones
  const budgets = await Budget.findAll({
    where: whereConditions,
    include: [
      { model: Person, as: "person" },
      { model: Home, as: "home" },
      { model: Category, as: "category" },
      { model: Type, as: "type" },
    ],
    order: [
      ['budget_type', 'ASC'],
      ['start_date', 'DESC']
    ]
  });

  // 3. Para cada presupuesto, calcular el used_amount usando el método del repositorio
  const budgetsMapped = await Promise.all(budgets.map(async (budget) => {
    let used_amount = 0;

    // Solo calcular si el tipo es válido
    const typeName = validTypeMap.get(budget.type_id);
    if (typeName && ['Diario', 'Semanal', 'Mensual', 'Anual'].includes(typeName)) {
      used_amount = await this.getTotalExpensesByBudgetIdAndType(budget.id, budget.type_id);
    }

    // Convertir a objeto plano y añadir los campos calculados
    const budgetPlain = budget.get({ plain: true });
    return {
      ...budgetPlain,
      used_amount,
      remaining_amount: parseFloat(budget.amount) - used_amount
    };
  }));

  return budgetsMapped;
  },

  async findAllByPersonIdHomeId(personId, homeId = null) {
    // Obtener el primer y último día del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const whereConditions = {
      [Op.or]: [
        { person_id: personId }
      ]
    };

    if (homeId) {
      whereConditions[Op.or].push({
        home_id: homeId
      });
    }

    const budgets = await Budget.findAll({
      where: {
        [Op.and]: [
          whereConditions,
          {
            start_date: {
              [Op.gte]: firstDayOfMonth,
              [Op.lte]: lastDayOfMonth
            }
          }
        ]
      },
      include: [
        { 
          model: Category, 
          as: "category",
          attributes: ['name']
        },
        { model: Type, as: "type" },
      ],
      attributes: ['id', 'amount'],
      order: [
        ['budget_type', 'ASC'],
        ['start_date', 'DESC']
      ]
    });

    // Eliminamos registros duplicados por ID
    const uniqueBudgets = budgets.filter((budget, index, self) => 
      index === self.findIndex(b => b.id === budget.id)
    );

    // Transformamos los resultados
    return uniqueBudgets.map(budget => ({
      id: budget.id,
      amount: budget.amount,
      type: budget.type,
      name: budget.category ? budget.category.name : null
    }));
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
        { model: Type, as: "type" },
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
        { model: Type, as: "type" },
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
        { model: Type, as: "type" },
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
          currency: body.currency || 'CLP',
          type_id: body.type_id || null,
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
      "currency",
      "type_id"
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
        { model: Type, as: "type" },
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
        { model: Type, as: "type" },
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
        { model: Type, as: "type" },
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
        { model: Type, as: "type" },
      ]
    });
  },

  /*async getPersonBudgetStats(person_id, home_id = null) {

    // Fechas para el mes actual y el anterior
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filtro base
    const whereConditions = {
      person_id: person_id,
      //status: 'Activo' // Solo presupuestos activos
    };

    // Consulta para el mes actual
    const currentMonthData = await Budget.findAll({
      where: {
        ...whereConditions,
        [Op.or]: [
          {
            start_date: { [Op.lte]: currentMonthEnd },
            end_date: { [Op.gte]: currentMonthStart }
          }
        ]
      },
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_budget'],
        [Sequelize.fn('SUM', Sequelize.col('used_amount')), 'total_used']
      ],
      raw: true
    });

    // Consulta para el mes anterior
    const lastMonthData = await Budget.findAll({
      where: {
        ...whereConditions,
        [Op.or]: [
          {
            start_date: { [Op.lte]: lastMonthEnd },
            end_date: { [Op.gte]: lastMonthStart }
          }
        ]
      },
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_budget'],
        [Sequelize.fn('SUM', Sequelize.col('used_amount')), 'total_used']
      ],
      raw: true
    });

    // Parsear resultados
    const currentBudget = parseFloat(currentMonthData[0]?.total_budget || 0);
    const currentUsed = parseFloat(currentMonthData[0]?.total_used || 0);
    const currentRemaining = currentBudget - currentUsed;

    const lastBudget = parseFloat(lastMonthData[0]?.total_budget || 0);
    const lastUsed = parseFloat(lastMonthData[0]?.total_used || 0);
    const lastRemaining = lastBudget - lastUsed;

    // Calcular diferencias porcentuales
    const budgetPercentage = lastBudget !== 0
      ? ((currentBudget - lastBudget) / lastBudget * 100).toFixed(2)
      : currentBudget !== 0 ? '100.00' : '0.00';

    const usedPercentage = lastUsed !== 0
      ? ((currentUsed - lastUsed) / lastUsed * 100).toFixed(2)
      : currentUsed !== 0 ? '100.00' : '0.00';

    const remainingPercentage = lastRemaining !== 0
      ? ((currentRemaining - lastRemaining) / lastRemaining * 100).toFixed(2)
      : currentRemaining !== 0 ? '100.00' : '0.00';

    return {
      currentMonth: {
        budget: currentBudget,
        used: currentUsed,
        remaining: currentRemaining
      },
      lastMonth: {
        budget: lastBudget,
        used: lastUsed,
        remaining: lastRemaining
      },
      percentages: {
        budget: budgetPercentage,
        used: usedPercentage,
        remaining: remainingPercentage
      }
    };
  }*/
 async getPersonBudgetStats(person_id, home_id = null) {
    // Fechas para el mes actual y el anterior
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1. Obtener todos los budgets de la persona
    const budgets = await Budget.findAll({
      where: { person_id },
      raw: true
    });

    // 2. Obtener IDs de budgets
    const budgetIds = budgets.map(b => b.id);

    // 3. Calcular total de budgets
    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

    // 4. Obtener gastos por mes usando el repositorio
    const currentMonthSpent = await FinanceRepository.getSpentSumByBudgetsAndDateRange(
      budgetIds, 
      currentMonthStart, 
      currentMonthEnd
    );
    
    const lastMonthSpent = await FinanceRepository.getSpentSumByBudgetsAndDateRange(
      budgetIds, 
      lastMonthStart, 
      lastMonthEnd
    );

    // 5. Calcular porcentajes de uso
    const currentUsagePercentage = totalBudget > 0 
      ? ((currentMonthSpent / totalBudget) * 100).toFixed(2)
      : '0.00';
    
    const lastUsagePercentage = totalBudget > 0
      ? ((lastMonthSpent / totalBudget) * 100).toFixed(2)
      : '0.00';
    logger.info(`Current usage percentage: ${currentUsagePercentage}`);
    logger.info(`Last month usage percentage: ${lastUsagePercentage}`);
    return {
      currentMonth: {
        budget: totalBudget,
        used: currentMonthSpent,
        remaining: totalBudget - currentMonthSpent,
        usagePercentage: currentUsagePercentage
      },
      lastMonth: {
        budget: totalBudget,
        used: lastMonthSpent,
        remaining: totalBudget - lastMonthSpent,
        usagePercentage: lastUsagePercentage
      }
    };
},
async getTotalExpensesByBudgetIdAndType(budgetId, typeId) {
  // Obtener tipos válidos de presupuesto
  const validTypes = await TypeRepository.findByType('Presupuesto');
  const type = validTypes.find(t => t.id === typeId);

  if (!type) {
    throw new Error(`Tipo de presupuesto inválido o no encontrado: ${typeId}`);
  }

  const { name } = type;
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Normaliza sin hora

  let startDate = null;
  let endDate = todayDate;

  switch (name) {
    case 'Diario':
      startDate = todayDate;
      break;

    case 'Semanal': {
      const day = today.getDay(); // 0 = domingo
      // Calcular lunes de la semana actual (lunes = 1, domingo = 0)
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(today.getFullYear(), today.getMonth(), diff);
      break;
    }

    case 'Mensual':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1); // 1 del mes
      break;

    case 'Anual':
      startDate = new Date(today.getFullYear(), 0, 1); // 1 de enero
      break;

    default:
      return 0; // Tipo no soportado
  }

  // Aseguramos que las fechas sean solo "día" (sin hora interna que afecte comparación)
  // Sequelize automáticamente ignora la hora si la columna es DATE

  const result = await Finance.findOne({
    attributes: [
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('spent')), 0), 'total']
    ],
    where: {
      budget_id: budgetId,
      date: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      },
      spent: {
        [Op.gt]: 0 // Solo registros donde epent > 0 (gastos)
      }
    }
  });

  return parseFloat(result.get('total')) || 0;
}
};

module.exports = BudgetRepository;