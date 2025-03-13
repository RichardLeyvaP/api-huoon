const { Op } = require("sequelize");
const { Emergency, Person, Type } = require("../models"); // Importar los modelos necesarios
const logger = require("../../config/logger"); // Importa el logger

const EmergencyRepository = {
  /**
   * Obtener todas las emergencias.
   */
  async findAll() {
    return await Emergency.findAll({
      include: [
        { model: Person, as: "person" }, // Relación con Person
        { model: Type, as: "type" }, // Relación con Type
      ],
    });
  },

  /**
   * Obtener todas las emergencias de una persona específica.
   * @param {number} personId - ID de la persona.
   */
  async findAllByPersonId(personId) {
    return await Emergency.findAll({
      where: { person_id: personId }, // Filtrar por personId
      include: [
        { model: Person, as: "person" }, // Relación con Person
        { model: Type, as: "type" }, // Relación con Type
      ],
    });
  },

  /**
   * Obtener una emergencia por su ID.
   * @param {number} id - ID de la emergencia.
   */
  async findById(id) {
    return await Emergency.findByPk(id, {
      include: [
        { model: Person, as: "person" }, // Relación con Person
        { model: Type, as: "type" }, // Relación con Type
      ],
    });
  },

  /**
   * Crear una nueva emergencia.
   * @param {object} body - Datos de la emergencia.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async create(body, t = null) {
    try {
      const emergency = await Emergency.create(
        {
          person_id: body.person_id,
          date: body.date,
          type_id: body.type_id,
          symptoms: body.symptoms,
          actionTaken: body.actionTaken,
          contactAlerted: body.contactAlerted,
          location: body.location,
        },
        { transaction: t }
      );
      return emergency;
    } catch (err) {
      logger.error(`Error en EmergencyRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar una emergencia existente.
   * @param {object} emergency - Instancia de la emergencia.
   * @param {object} body - Datos actualizados.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async update(emergency, body, t = null) {
    // Lista de campos permitidos para actualizar
    const fieldsToUpdate = [
      "date",
      "type_id",
      "symptoms",
      "actionTaken",
      "contactAlerted",
      "location",
    ];

    try {
      // Filtrar campos en body y construir el objeto updatedData
      const updatedData = Object.keys(body)
        .filter(
          (key) => fieldsToUpdate.includes(key) && body[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      // Actualizar la emergencia solo si hay datos para cambiar
      if (Object.keys(updatedData).length > 0) {
        await emergency.update(updatedData, { transaction: t });
        logger.info(
          `Emergencia actualizada exitosamente (ID: ${emergency.id})`
        );
      }

      return updatedData;
    } catch (err) {
      logger.error(`Error en EmergencyRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar una emergencia.
   * @param {object} emergency - Instancia de la emergencia.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async delete(emergency, t = null) {
    try {
      await emergency.destroy({ transaction: t });
      logger.info(
        `Emergencia eliminada exitosamente (ID: ${emergency.id})`
      );
    } catch (err) {
      logger.error(`Error en EmergencyRepository->delete: ${err.message}`);
      throw err;
    }
  },
};

module.exports = EmergencyRepository;