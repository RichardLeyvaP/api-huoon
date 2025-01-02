const { Op } = require('sequelize');
const { AiInteraction } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

AiInteractionRepository = {
  // Crear una nueva interacción
  async create(body) {
    const { module, question, answer, user_id } = body;

    try {
      return await AiInteraction.create({
        module,
        question,
        answer,
        user_id
      });
    } catch (err) {
      logger.error(`Error al crear la Interaccion: ${err.message}`);
      throw new Error('Error al crear la intereccion');
    }
  },

};

module.exports = AiInteractionRepository;
