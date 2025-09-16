const { Op } = require("sequelize");
const { FamilyBackground, Person, Home, Type } = require("../models");
const logger = require("../../config/logger");

const FamilyBackgroundRepository = {
  /**
   * Obtener todos los antecedentes familiares.
   */
  async findAll() {
    return await FamilyBackground.findAll({
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        { model: Type, as: "type" },
      ],
      order: [['diagnosis_age', 'DESC']] // Ordenar por edad de diagnóstico descendente
    });
  },

  /**
   * Obtener todos los antecedentes familiares de una persona específica.
   * @param {number} personId - ID de la persona.
   */
  async findAllByPersonId(personId) {
    return await FamilyBackground.findAll({
      where: { person_id: personId },
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        { model: Type, as: "type" },
      ],
      order: [['diagnosis_age', 'DESC']]
    });
  },

  /**
   * Obtener un antecedente familiar por su ID.
   * @param {number} id - ID del antecedente.
   */
  async findById(id) {
    return await FamilyBackground.findByPk(id, {
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        { model: Type, as: "type" },
      ]
    });
  },

  /**
   * Crear un nuevo antecedente familiar.
   * @param {object} body - Datos del antecedente.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async getCurrentLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, 
  async create(body, t = null) {
    try {
      const background = await FamilyBackground.create(
        {
          person_id: body.person_id,
          home_id: body.home_id || null,
          type_id: body.type_id || null,
          relationship: body.relationship,
          disease: body.disease,
          details: body.details || null,
          diagnosis_age: body.diagnosis_age || null,
          date: body.date || this.getCurrentDate()
        },
        { transaction: t }
      );
      return background;
    } catch (err) {
      logger.error(`Error en FamilyBackgroundRepository->create: ${err.message}`);
      throw err;
    }
  },

  getCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // "2025-07-15"
  },


  /**
   * Actualizar un antecedente familiar existente.
   * @param {object} background - Instancia del antecedente.
   * @param {object} body - Datos actualizados.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async update(background, body, t = null) {
    // Lista de campos permitidos para actualizar
    const fieldsToUpdate = [
      "home_id",
      "type_id",
      "relationship",
      "disease",
      "details",
      "diagnosis_age",
      "date"
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

      // Actualizar solo si hay datos para cambiar
      if (Object.keys(updatedData).length > 0) {
        await background.update(updatedData, { transaction: t });
        logger.info(
          `Antecedente familiar actualizado exitosamente (ID: ${background.id})`
        );
      }

      return updatedData;
    } catch (err) {
      logger.error(`Error en FamilyBackgroundRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar un antecedente familiar.
   * @param {object} background - Instancia del antecedente.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async delete(background, t = null) {
    try {
      await background.destroy({ transaction: t });
      logger.info(
        `Antecedente familiar eliminado exitosamente (ID: ${background.id})`
      );
    } catch (err) {
      logger.error(`Error en FamilyBackgroundRepository->delete: ${err.message}`);
      throw err;
    }
  },

  /**
   * Obtener antecedentes familiares por tipo
   * @param {number} typeId - ID del tipo de antecedente
   * @param {number} personId - ID de la persona (opcional)
   */
  async findByType(typeId, personId = null) {
    const where = { type_id: typeId };
    if (personId) {
      where.person_id = personId;
    }

    return await FamilyBackground.findAll({
      where,
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        { model: Type, as: "type" },
      ],
      order: [['diagnosis_age', 'DESC']]
    });
  },

  /**
   * Obtener antecedentes familiares por parentesco
   * @param {string} relationship - Parentesco (Father, Mother, etc.)
   * @param {number} personId - ID de la persona (opcional)
   */
  async findByRelationship(relationship, personId = null) {
    const where = { relationship };
    if (personId) {
      where.person_id = personId;
    }

    return await FamilyBackground.findAll({
      where,
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
        { model: Type, as: "type" },
      ],
      order: [['diagnosis_age', 'DESC']]
    });
  },

  /**
   * Obtener antecedentes familiares por enfermedad
   * @param {string} disease - Enfermedad a buscar
   * @param {number} personId - ID de la persona (opcional)
   */
  async findByDisease(disease, personId = null) {
    const where = { 
      disease: { [Op.iLike]: `%${disease}%` } // Búsqueda case insensitive
    };
    if (personId) {
      where.person_id = personId;
    }

    return await FamilyBackground.findAll({
      where,
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
      ],
      order: [['diagnosis_age', 'DESC']]
    });
  }
};

module.exports = FamilyBackgroundRepository;