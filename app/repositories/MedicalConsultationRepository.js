const { Op } = require("sequelize");
const { MedicalConsultation, Person } = require("../models"); // Importar los modelos necesarios
const logger = require("../../config/logger"); // Importa el logger

const MedicalConsultationRepository = {
  /**
   * Obtener todas las consultas médicas.
   */
  async findAll() {
    return await MedicalConsultation.findAll({
      include: [
        { model: Person, as: "person" }, // Relación con Person
      ],
    });
  },

  /**
   * Obtener todas las consultas médicas de una persona específica.
   * @param {number} personId - ID de la persona.
   */
  async findAllByPersonId(personId) {
    return await MedicalConsultation.findAll({
      where: { person_id: personId }, // Filtrar por personId
      include: [
        { model: Person, as: "person" }, // Relación con Person
      ],
    });
  },

  /**
   * Obtener una consulta médica por su ID.
   * @param {number} id - ID de la consulta médica.
   */
  async findById(id) {
    return await MedicalConsultation.findByPk(id, {
      include: [
        { model: Person, as: "person" }, // Relación con Person
      ],
    });
  },

  /**
   * Crear una nueva consulta médica.
   * @param {object} body - Datos de la consulta médica.
   * @param {number} personId - ID de la persona asociada.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async create(body, personId, t = null) {
    try {
      const medicalConsultation = await MedicalConsultation.create(
        {
          date: body.date,
          reason: body.reason,
          diagnosis: body.diagnosis,
          treatments: body.treatments,
          medicalNotes: body.medicalNotes,
          files: body.files,
          person_id: personId,
        },
        { transaction: t }
      );
      return medicalConsultation;
    } catch (err) {
      logger.error(`Error en MedicalConsultationRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar una consulta médica existente.
   * @param {object} medicalConsultation - Instancia de la consulta médica.
   * @param {object} body - Datos actualizados.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async update(medicalConsultation, body, t = null) {
    // Lista de campos permitidos para actualizar
    const fieldsToUpdate = [
      "date",
      "reason",
      "diagnosis",
      "treatments",
      "medicalNotes",
      "files",
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

      // Actualizar la consulta médica solo si hay datos para cambiar
      if (Object.keys(updatedData).length > 0) {
        await medicalConsultation.update(updatedData, { transaction: t });
        logger.info(
          `Consulta médica actualizada exitosamente (ID: ${medicalConsultation.id})`
        );
      }

      return updatedData;
    } catch (err) {
      logger.error(`Error en MedicalConsultationRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar una consulta médica.
   * @param {object} medicalConsultation - Instancia de la consulta médica.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async delete(medicalConsultation, t = null) {
    try {
      await medicalConsultation.destroy({ transaction: t });
      logger.info(
        `Consulta médica eliminada exitosamente (ID: ${medicalConsultation.id})`
      );
    } catch (err) {
      logger.error(`Error en MedicalConsultationRepository->delete: ${err.message}`);
      throw err;
    }
  },
};

module.exports = MedicalConsultationRepository;