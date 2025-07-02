const { Op } = require("sequelize");
const { Suggestion, Person, Home } = require("../models");
const logger = require("../../config/logger");

const SuggestionRepository = {
  /**
   * Obtener todas las sugerencias.
   */
  async findAll() {
    return await Suggestion.findAll({
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
      ],
      order: [['date', 'DESC']],
    });
  },

  /**
   * Obtener todas las sugerencias de una persona específica.
   * @param {number} personId - ID de la persona.
   */
  async findAllByPersonId(personId, date = null) {
  const where = { person_id: personId };

  if (date) {
    where.date = date;  // comparas directamente con "yyyy-mm-dd"
  }

  return await Suggestion.findAll({
    where,
    include: [
      { model: Person, as: "person" },
      { model: Home, as: "home" },
    ],
    order: [['date', 'DESC']],
  });
},


  /**
   * Obtener una sugerencia por su ID.
   * @param {number} id - ID de la sugerencia.
   */
  async findById(id) {
    return await Suggestion.findByPk(id, {
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
      ],
    });
  },

  /**
   * Obtener fecha actual local en formato YYYY-MM-DD.
   */
  async getCurrentLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Crear una nueva sugerencia.
   * @param {object} body - Datos de la sugerencia.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async create(body, t = null) {
    try {
      const suggestion = await Suggestion.create(
        {
          person_id: body.person_id,
          home_id: body.home_id || null,
          date: body.date || await this.getCurrentLocalDate(),
          title: body.title,
          description: body.description || null,
          content: body.content || null,
          status: body.status || 'pending',
        },
        { transaction: t }
      );
      return suggestion;
    } catch (err) {
      logger.error(`Error en SuggestionRepository->create: ${err.message}`);
      throw err;
    }
  },

  /**
   * Actualizar una sugerencia existente.
   * @param {object} suggestion - Instancia de Suggestion.
   * @param {object} body - Datos actualizados.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async update(suggestion, body, t = null) {
    const fieldsToUpdate = [
      "home_id",
      "date",
      "title",
      "description",
      "content",
      "status"
    ];

    try {
      const updatedData = Object.keys(body)
        .filter(key => fieldsToUpdate.includes(key) && body[key] !== undefined)
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      if (Object.keys(updatedData).length > 0) {
        await suggestion.update(updatedData, { transaction: t });
        logger.info(`Sugerencia actualizada exitosamente (ID: ${suggestion.id})`);
      }

      return updatedData;
    } catch (err) {
      logger.error(`Error en SuggestionRepository->update: ${err.message}`);
      throw err;
    }
  },

  /**
   * Eliminar una sugerencia.
   * @param {object} suggestion - Instancia de Suggestion.
   * @param {object} t - Transacción de Sequelize (opcional).
   */
  async delete(suggestion, t = null) {
    try {
      await suggestion.destroy({ transaction: t });
      logger.info(`Sugerencia eliminada exitosamente (ID: ${suggestion.id})`);
    } catch (err) {
      logger.error(`Error en SuggestionRepository->delete: ${err.message}`);
      throw err;
    }
  },

  /**
   * Buscar sugerencias por estado (opcional por persona).
   * @param {string} status - Estado de la sugerencia.
   * @param {number} personId - ID de la persona (opcional).
   */
  async findByStatus(status, personId = null) {
    const where = { status };
    if (personId) {
      where.person_id = personId;
    }

    return await Suggestion.findAll({
      where,
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
      ],
      order: [['date', 'DESC']],
    });
  },

  /**
   * Buscar sugerencias por título o contenido (búsqueda parcial).
   * @param {string} keyword - Palabra clave a buscar.
   * @param {number} personId - ID de la persona (opcional).
   */
  async search(keyword, personId = null) {
    const where = {
      [Op.or]: [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { content: { [Op.iLike]: `%${keyword}%` } },
      ],
    };

    if (personId) {
      where.person_id = personId;
    }

    return await Suggestion.findAll({
      where,
      include: [
        { model: Person, as: "person" },
        { model: Home, as: "home" },
      ],
      order: [['date', 'DESC']],
    });
  },
};

module.exports = SuggestionRepository;
