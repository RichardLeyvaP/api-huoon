const { Op } = require("sequelize");
const { MedicalHistory, Person } = require("../models"); // Importar los modelos necesarios
const logger = require("../../config/logger"); // Importa el logger

const MedicalHistoryRepository = {
  /**
   * Obtener todos los historiales médicos.
   */
  async findAll() {
    return await MedicalHistory.findAll({
      include: [
        { model: Person, as: "person" }, // Relación con Person
      ],
    });
  },

  /**
   * Obtener todos los historiales médicos de una persona específica.
   * @param {number} personId - ID de la persona.
   */
  async findAllByPersonId(personId) {
    return await MedicalHistory.findAll({
      where: { person_id : personId }, // Filtrar por personId
      include: [
        { model: Person, as: "person" }, // Relación con Person
      ],
    });
  },

  /**
   * Obtener un historial médico por su ID.
   * @param {number} id - ID del historial médico.
   */
  async findById(id) {
    return await MedicalHistory.findByPk(id, {
      include: [
        { model: Person, as: "person" }, // Relación con Person
      ],
    });
  },

  /**
   * Crear un nuevo historial médico.
   * @param {object} body - Datos del historial médico.
   * @param {number} personId - ID de la persona asociada.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async create(body, personId, t = null) {
    try {
      const medicalHistory = await MedicalHistory.create(
        {
          familyBackground: body.familyBackground,
          personalBackground: body.personalBackground,
          bloodType: body.bloodType,
          vaccines: body.vaccines,
          currentMedications: body.currentMedications,
          person_id: personId,
        },
        { transaction: t }
      );
      return medicalHistory;
    } catch (err) {
      logger.error(`Error en MedicalHistoryRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar un historial médico existente.
   * @param {object} medicalHistory - Instancia del historial médico.
   * @param {object} body - Datos actualizados.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async update(medicalHistory, body, t = null) {
    // Lista de campos permitidos para actualizar
    const fieldsToUpdate = [
      "familyBackground",
      "personalBackground",
      "bloodType",
      "vaccines",
      "currentMedications",
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

      // Actualizar el historial médico solo si hay datos para cambiar
      if (Object.keys(updatedData).length > 0) {
        await medicalHistory.update(updatedData, { transaction: t });
        logger.info(
          `Historial médico actualizado exitosamente (ID: ${medicalHistory.id})`
        );
      }

      return updatedData;
    } catch (err) {
      logger.error(`Error en MedicalHistoryRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar un historial médico.
   * @param {object} medicalHistory - Instancia del historial médico.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async delete(medicalHistory, t = null) {
    try {
      await medicalHistory.destroy({ transaction: t });
      logger.info(
        `Historial médico eliminado exitosamente (ID: ${medicalHistory.id})`
      );
    } catch (err) {
      logger.error(`Error en MedicalHistoryRepository->delete: ${err.message}`);
      throw err;
    }
  },
};

module.exports = MedicalHistoryRepository;