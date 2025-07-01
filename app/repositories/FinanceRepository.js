const path = require("path");
const fs = require("fs");
const { Sequelize, Op } = require('sequelize'); // Asegúrate de importar Sequelize
const { Finance, User, sequelize } = require("../models");
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
      return finance;
    } catch (err) {
      logger.error(`Error en FinanceRepository->create: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  },

  async update(finance, body, file, t) {
    // Lista de campos que pueden ser actualizados
    const fieldsToUpdate = [
      "home_id",
      "person_id",
      "spent",
      "income",
      "date",
      "description",
      "type",
      "method",
    ];

    const updatedData = Object.keys(body)
      .filter((key) => fieldsToUpdate.includes(key) && body[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    try {
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
  }
};

module.exports = FinanceRepository;
