const path = require("path");
const fs = require("fs");
const { Sequelize, Op } = require('sequelize'); // Asegúrate de importar Sequelize
const { Finance, User, Budget, Category, sequelize } = require("../models");
const logger = require("../../config/logger"); // Logger para seguimiento
const ImageService = require("../services/ImageService");

const FinanceRepository = {
  async findAll() {
    return await Finance.findAll({
      attributes: [
        "id",
        "home_id",
        "person_id",
        "spent",
        "income",
        "date",
        "description",
        "type",
        "method",
        "image",
      ],
    });
  },

  /*async findAllType(id, home_id = null, type) {
    const whereConditions = {};
    // Según el tipo, establecer el campo correcto para la consulta
    if (type === "Hogar") {
      whereConditions.type = type;
      whereConditions.home_id = id; // Si el tipo es 'Hogar', usa home_id
    } else if (type === "Personal") {
      whereConditions.type = type;
      whereConditions.person_id = id; // Si el tipo es 'Persona', usa person_id
    } else {
      whereConditions[Op.or] = [
        { home_id: home_id, type: "Hogar" }, // Si home_id es igual al parámetro y type es 'Hogar'
        { person_id: id, type: "Personal" }, // Si person_id es igual al parámetro y type es 'Personal'
      ];
    }
    return await Finance.findAll({
      where: whereConditions,
      attributes: [
        "id",
        "home_id",
        "person_id",
        "spent",
        "income",
        "date",
        "description",
        "type",
        "method",
        "image",
      ],
    });
  },*/
  async findAllType(id, home_id = null, type, date = null) {
    const whereConditions = {};
    
    // Configuración según tipo
    if (type === "Hogar") {
      whereConditions.type = type;
      whereConditions.home_id = id;
    } else if (type === "Personal") {
      whereConditions.type = type;
      whereConditions.person_id = id;
    } else {
      whereConditions[Op.or] = [
        { home_id: home_id, type: "Hogar" },
        { person_id: id, type: "Personal" }
      ];
    }

    // Manejo de fecha si se proporciona
    if (date) {
      // Opción 1: Comparación exacta (si el campo date es de tipo DATE)
      // whereConditions.date = date;
      
      // Opción 2: Comparación por día (si el campo es DATETIME)
      whereConditions.date = {
        [Op.and]: [
          Sequelize.where(Sequelize.fn('DATE', Sequelize.col('Finance.date')), '=', date)
        ]
      };
      
      // Opción 3: Rango de fechas para todo el día (alternativa)
      // whereConditions.date = {
      //   [Op.gte]: new Date(date + 'T00:00:00'),
      //   [Op.lte]: new Date(date + 'T23:59:59')
      // }
    }

    return await Finance.findAll({
      where: whereConditions,
      attributes: [
        "id",
        "home_id",
        "person_id",
        "budget_id",
        "spent",
        "income",
        "date",
        "description",
        "type",
        "method",
        "image",
      ],
      order: [
        ['date', 'DESC'] // Ordenar por fecha descendente
      ]
    });
  },

  async findAllTypeRange(id, home_id = null, type, dateRange = {}) {
    const whereConditions = {};
    
    // Configuración según tipo
    if (type === "Hogar") {
        whereConditions.type = type;
        whereConditions.home_id = id;
    } else if (type === "Personal") {
        whereConditions.type = type;
        whereConditions.person_id = id;
    } else {
        whereConditions[Op.or] = [
            { home_id: home_id, type: "Hogar" },
            { person_id: id, type: "Personal" }
        ];
    }

    // Función para normalizar fechas (maneja Date objetos o strings YYYY-MM-DD)
    const normalizeDate = (date) => {
        if (!date) return null;
        if (date instanceof Date) return date;
        if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return new Date(date + 'T00:00:00');
        }
        return new Date(date);
    };

    // Manejo del rango de fechas
    if (dateRange.startDate || dateRange.endDate) {
        const startDate = normalizeDate(dateRange.startDate);
        const endDate = normalizeDate(dateRange.endDate);

        whereConditions.date = {};
        
        if (startDate) {
            whereConditions.date[Op.gte] = startDate;
        }
        if (endDate) {
            // Asegurar que incluya todo el día
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            whereConditions.date[Op.lte] = endOfDay;
        }
    } else {
        // Rango por defecto: mes actual
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999); // Fin del día
        
        whereConditions.date = {
            [Op.between]: [startDate, endDate]
        };
    }

    return await Finance.findAll({
        where: whereConditions,
        attributes: [
            "id",
            "home_id",
            "person_id",
            "spent",
            "income",
            "date",
            "description",
            "type",
            "method",
            "image",
            "budget_id" // Añadir este campo
        ],
        include: [
            {
                model: Budget,
                as: 'budget',
                attributes: ['id', 'amount', 'used_amount'],
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name', 'icon']
                }]
            }
        ],
        order: [
            ['date', 'DESC']
        ]
    });
  },
  async findById(id) {
    return await Finance.findByPk(id, {
      attributes: [
        "id",
        "home_id",
        "person_id",
        "budget_id",
        "spent",
        "income",
        "date",
        "description",
        "type",
        "method",
        "image",
      ],
    });
  },

  async create(body, file, t) {
    try {
      // Crear el registro financiero
      let finance = await Finance.create(
        {
          home_id: body.home_id,
          person_id: body.person_id,
          spent: body.spent,
          income: body.income,
          date: body.date,
          description: body.description,
          type: body.type,
          method: body.method,
          budget_id: body.budget_id,
          image: "finances/default.jpg", // Imagen por defecto
        },
        { transaction: t }
      );

      // Manejo de archivos adjuntos
      if (file) {
        const newFilename = ImageService.generateFilename(
          "finances",
          finance.id,
          file.originalname
        );
        finance.image = await ImageService.moveFile(file, newFilename);
        await finance.update({ image: finance.image }, { transaction: t });
      }

      // Actualizar el used_amount en budgets si hay un budget_id válido
      // Debug: verificar valores recibidos
      logger.info(`Datos recibidos - budget_id: ${body.budget_id}, spent: ${body.spent}`);

      if (body.budget_id && body.budget_id !== 0 && body.spent) {
        logger.info('Actualizando used_amount...');
        await this.updateBudgetUsedAmount(body.budget_id, body.spent, t);
      }
      return finance;
    } catch (err) {
      logger.error(`Error en FinanceRepository->create: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  },

  async updateBudgetUsedAmount(budgetId, amount, t) {
    try {
      // Validar que amount sea un número positivo
      const spentAmount = parseFloat(amount);
      if (isNaN(spentAmount) || spentAmount <= 0) {
        throw new Error(`Monto inválido: ${amount}`);
      }

      const budget = await Budget.findByPk(budgetId, { transaction: t });
      if (!budget) {
        throw new Error(`Presupuesto no encontrado (ID: ${budgetId})`);
      }

      // Debug: valores antes de actualizar
      logger.info(`Budget actual - used_amount: ${budget.used_amount}, amount: ${budget.amount}`);

      const newUsedAmount = parseFloat(budget.used_amount || 0) + spentAmount;
   
      await budget.update({ used_amount: newUsedAmount }, { transaction: t });
      
      logger.info(`Budget actualizado - used_amount: ${newUsedAmount}`);
    } catch (err) {
      logger.error(`Error en updateBudgetUsedAmount: ${err.message}`);
      throw err;
    }
  },
   async getSpentSumByBudgetsAndDateRange(budgetIds, startDate, endDate) {
    return await Finance.sum('spent', {
      where: {
        budget_id: { [Op.in]: budgetIds },
        date: { [Op.between]: [startDate, endDate] }
      }
    }) || 0;
  },
  async update(finance, body, file, t) {
    // Lista de campos que pueden ser actualizados
    const fieldsToUpdate = [
      "home_id",
      "budget_id",
      "person_id",
      "spent",
      "income",
      "date",
      "description",
      "type",
      "method",
      "category_id"
    ];

    const updatedData = Object.keys(body)
      .filter((key) => fieldsToUpdate.includes(key) && body[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    try {
      // Manejar cambios en el presupuesto (budget_id o spent)
     if (body.budget_id !== undefined || body.spent !== undefined) {
      logger.info(`Actualizando presupuesto - old_budget: ${finance.budget_id}, new_budget: ${body.budget_id}, old_spent: ${finance.spent}, new_spent: ${body.spent}`);
    }
      // Manejar el archivo si se proporciona
      if (file) {
        if (finance.image && finance.image !== "finances/default.jpg") {
            await ImageService.deleteFile(finance.image);
          }
          const newFilename = ImageService.generateFilename(
            "finances",
            finance.id,
            file.originalname
          );
          updatedData.image = await ImageService.moveFile(
            file,
            newFilename
          );
        }

      // Actualizar los datos en la base de datos si hay cambios
      if (Object.keys(updatedData).length > 0) {
        await finance.update(updatedData, { transaction: t }); // Usar la transacción
        logger.info(
          `Registro financiero actualizado exitosamente (ID: ${finance.id})`
        );
      }

      return finance;
    } catch (err) {
      logger.error(`Error en FinanceRepository->update: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  },
  async handleBudgetUpdate(finance, body, t) {
    const oldBudgetId = finance.budget_id;
    const oldSpent = parseFloat(finance.spent) || 0;
    const newBudgetId = body.budget_id !== undefined ? body.budget_id : oldBudgetId;
    const newSpent = body.spent !== undefined ? parseFloat(body.spent) : oldSpent;

    // Caso 1: No hay presupuesto asociado (ni viejo ni nuevo)
    if (!oldBudgetId && !newBudgetId) return;

    // Caso 2: Se removió el presupuesto (restar del viejo)
    if (oldBudgetId && !newBudgetId) {
      await this.adjustBudgetAmount(oldBudgetId, -oldSpent, t);
      return;
    }

    // Caso 3: Se cambió de presupuesto
    if (oldBudgetId && newBudgetId && oldBudgetId !== newBudgetId) {
      // Restar del presupuesto viejo
      await this.adjustBudgetAmount(oldBudgetId, -oldSpent, t);
      // Sumar al nuevo presupuesto
      await this.adjustBudgetAmount(newBudgetId, newSpent, t);
      return;
    }

    // Caso 4: Mismo presupuesto pero cambió el monto
    if (oldBudgetId === newBudgetId && oldSpent !== newSpent) {
      const difference = newSpent - oldSpent;
      await this.adjustBudgetAmount(newBudgetId, difference, t);
    }
  },

  /**
   * Ajusta el monto usado en un presupuesto
   * @param {number} budgetId - ID del presupuesto
   * @param {number} amount - Cantidad a ajustar (puede ser positiva o negativa)
   * @param {object} t - Transacción de Sequelize
   */
  async adjustBudgetAmount(budgetId, amount, t) {
    try {
      const budget = await Budget.findByPk(budgetId, { transaction: t });
      if (budget) {
        const newUsedAmount = parseFloat(budget.used_amount || 0) + amount;
        await budget.update({ used_amount: newUsedAmount }, { transaction: t });
      }
    } catch (err) {
      logger.error(`Error en FinanceRepository->adjustBudgetAmount: ${err.message}`);
      throw err;
    }
  },
  async delete(finance) {
    if (finance.image && finance.image !== "finances/default.jpg") {
        await ImageService.deleteFile(finance.image);
      }

    return await finance.destroy();
  },
  async getPersonFinancialStats(person_id) {
    const whereConditions = {
        person_id: person_id
    };

    // Obtener fechas para el mes actual y anterior
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Consulta para el mes actual (solo finanzas personales)
    const currentMonthData = await Finance.findAll({
      where: {
        ...whereConditions,
        date: {
          [Op.between]: [currentMonthStart, currentMonthEnd]
        }
      },
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('income')), 'total_income'],
        [Sequelize.fn('SUM', Sequelize.col('spent')), 'total_spent'],
        [Sequelize.literal('SUM(COALESCE(income, 0)) - SUM(COALESCE(spent, 0))'), 'balance']
      ],
      raw: true
    });

    // Consulta para el mes anterior (solo finanzas personales)
    const lastMonthData = await Finance.findAll({
      where: {
        ...whereConditions,
        date: {
          [Op.between]: [lastMonthStart, lastMonthEnd]
        }
      },
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('income')), 'total_income'],
        [Sequelize.fn('SUM', Sequelize.col('spent')), 'total_spent']
      ],
      raw: true
    });
    // Obtener el último registro personal
    const lastRecord = await Finance.findOne({
      where: whereConditions,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      attributes: [
        "id",
        "person_id",
        "spent",
        "income",
        "date",
        "description",
        "type",
        "method",
        "image"
      ]
    });

    // Calcular valores
    const currentIncome = parseFloat(currentMonthData[0]?.total_income || 0);
    const currentSpent = parseFloat(currentMonthData[0]?.total_spent || 0);
    const currentBalance = parseFloat(currentMonthData[0]?.balance || 0);
    const lastIncome = parseFloat(lastMonthData[0]?.total_income || 0);
    const lastSpent = parseFloat(lastMonthData[0]?.total_spent || 0);

    // Calcular diferencia porcentual
    const incomePercentage = lastIncome !== 0 
      ? ((currentIncome - lastIncome) / lastIncome * 100).toFixed(2)
      : currentIncome !== 0 ? '100.00' : '0.00';
    
    const spentPercentage = lastSpent !== 0 
      ? ((currentSpent - lastSpent) / lastSpent * 100).toFixed(2)
      : currentSpent !== 0 ? '100.00' : '0.00';

    return {
      currentMonth: {
        income: currentIncome,
        spent: currentSpent,
        balance: currentBalance
      },
      lastMonth: {
        income: lastIncome,
        spent: lastSpent
      },
      percentages: {
        income: incomePercentage,
        spent: spentPercentage
      },
      lastRecord: lastRecord ? {
        id: lastRecord.id,
        person_id: lastRecord.person_id,
        spent: lastRecord.spent,
        income: lastRecord.income,
        date: lastRecord.date,
        description: lastRecord.description,
        type: lastRecord.type,
        method: lastRecord.method,
        image: lastRecord.image
      } : null
    };
  },
  async getMonthlyIncomeAndSpentCurrentYear(homeId = null, personId, type) {
  const currentYear = new Date().getFullYear();

  // Construir condiciones dinámicas
 const whereCondition = {
    date: {
      [Op.gte]: `${currentYear}-01-01`,
      [Op.lt]: `${currentYear + 1}-01-01`
    }
  };

  // Ajustar condiciones según el tipo
  if (type === 'Personal') {
    whereCondition.person_id = personId;
    whereCondition.type = 'Personal';
  } else if (type === 'Hogar') {
    whereCondition.home_id = homeId;
    whereCondition.type = 'Hogar';
    // → No se agrega person_id, ni se filtra por persona
  }


  const results = await Finance.findAll({
    attributes: [
      [Sequelize.fn('MONTH', Sequelize.col('date')), 'month'], // Mes 1-12
      [Sequelize.fn('SUM', Sequelize.col('income')), 'totalIncome'],
      [Sequelize.fn('SUM', Sequelize.col('spent')), 'totalSpent']
    ],
    where: whereCondition,
    group: [Sequelize.fn('MONTH', Sequelize.col('date'))],
    raw: true
  });

  // Inicializar arreglos de 12 meses (índice 0 = enero)
  const customIncomeData = Array(12).fill(0);
  const customSpentData = Array(12).fill(0);

  // Llenar los valores: restamos 1 al mes para convertir de 1-12 a 0-11
  results.forEach(row => {
    const monthIndex = parseInt(row.month) - 1; // Enero = 1 → índice 0
    if (monthIndex >= 0 && monthIndex <= 11) {
      customIncomeData[monthIndex] = parseFloat(row.totalIncome) || 0;
      customSpentData[monthIndex] = parseFloat(row.totalSpent) || 0;
    }
  });

  return {
    customIncomeData,
    customSpentData
  };
  },
// En tu repository
  async getAllExpensesAndBudgetCategories(personId, startDate = null, endDate = null, home_id, type) {
    if (!startDate || !endDate) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59);
    }

    try {
      const budgetWhere = {};
    const expenseWhere = {
      date: { [Op.between]: [startDate, endDate] },
      spent: { [Op.gt]: 0 }
    };

    // Aplicar filtros según el tipo
    if (type === 'Personal') {
      budgetWhere.person_id = personId;
      expenseWhere.person_id = personId;
    } else if (type === 'Hogar') {
      budgetWhere.home_id = home_id;
      expenseWhere.home_id = home_id;
    }

     budgetWhere.budget_type = type;
    expenseWhere.type = type;
      // Paso 1: Obtener todos los presupuestos y sus categorías (padres e hijas)
      const budgets = await Budget.findAll({
        where: budgetWhere,
        include: [
          {
            model: Category,
            as: "category",
            required: true,
            attributes: ["id", "name", "color", "parent_id", "state"],
          },
        ],
        raw: true,
        nest: true,
      });

      // Extraer todos los IDs de categorías (incluyendo padres e hijos)
      const categoryIds = [...new Set(budgets.map(b => b.category.id))];

      // Paso 2: Obtener gastos solo para categorías con presupuesto
      const expenses = await Finance.findAll({
   where: expenseWhere,
    attributes: [
      [Sequelize.fn("SUM", Sequelize.col("Finance.spent")), "total"],
      [Sequelize.col("budget.category.id"), "categoryId"],
      [Sequelize.col("budget.category.name"), "categoryName"],
      [Sequelize.col("budget.category.color"), "color"],
      [Sequelize.col("budget.category.parent_id"), "parentId"],
      [Sequelize.col("budget.category.state"), "state"],
    ],
    include: [
      {
        model: Budget,
        as: "budget",
        required: true,
        include: [
          {
            model: Category,
            as: "category",
            required: true,
            where: {
              id: { [Op.in]: categoryIds }, // ← Filtro aquí, no en el where principal
            },
            attributes: [], // no agregamos campos extras
          },
        ],
        attributes: [],
      },
    ],
    group: [
      "budget.category.id",
      "budget.category.name",
      "budget.category.color",
      "budget.category.parent_id",
      "budget.category.state",
    ],
    raw: true,
  });

      return { budgets, expenses, categoryIds };
    } catch (error) {
      console.error("Error en getAllExpensesAndBudgetCategories:", error);
      throw error;
    }
  },
  async getAvailableMoneyCurrentMonth(homeId = null, personId) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const endOfMonth = currentMonth === 12
    ? `${currentYear + 1}-01-01`
    : `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;

  // Construimos condiciones OR: registros del mes actual que sean:
  // - Personales del usuario (personId) O
  // - Del hogar (homeId, si no es null)
  const whereCondition = {
    date: {
      [Op.gte]: startOfMonth,
      [Op.lt]: endOfMonth
    },
    [Op.or]: [
      {
        type: 'Personal',
        person_id: personId
      }
    ]
  };

  // Si homeId es válido, agregamos la condición para Hogar
  if (homeId !== null) {
    whereCondition[Op.or].push({
      type: 'Hogar',
      home_id: homeId
    });
  }

  // Obtenemos todos los registros relevantes en una sola consulta
  const records = await Finance.findAll({
    attributes: ['type', 'income', 'spent'],
    where: whereCondition,
    raw: true
  });

  // Inicializamos acumuladores
  let personalIncome = 0, personalSpent = 0;
  let homeIncome = 0, homeSpent = 0;

  // Procesamos cada registro en memoria
  records.forEach(record => {
    const income = parseFloat(record.income) || 0;
    const spent = parseFloat(record.spent) || 0;

    if (record.type === 'Personal') {
      personalIncome += income;
      personalSpent += spent;
    } else if (record.type === 'Hogar') {
      homeIncome += income;
      homeSpent += spent;
    }
  });

  const personalAvailable = personalIncome - personalSpent;
  const homeAvailable = homeIncome - homeSpent;

  return {
    personal: {
      income: personalIncome,
      spent: personalSpent,
      available: personalAvailable
    },
    home: homeId !== null ? {
      income: homeIncome,
      spent: homeSpent,
      available: homeAvailable
    } : null
  };
}
};

module.exports = FinanceRepository;
