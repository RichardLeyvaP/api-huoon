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
  }
};

module.exports = FinanceRepository;
