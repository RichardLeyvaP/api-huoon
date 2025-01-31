// services/StatusService.js

const { Status } = require('../models'); // Importa tus modelos
const logger = require('../../config/logger'); // Importa el logger
const i18n = require('../../config/i18n-config');

class StatusService {
  // Método para obtener categorías
  static async getStatus(type) {
    logger.info(`Entra a Buscar Los estados de ${type}`);
    try {
        const statuses = await Status.findAll({
            where: { type: type }
        });

        return statuses.map(status => {
            return {
                id: status.id,
                nameStatus:  i18n.__(`status.${status.name}.name`) !==
                            `status.${status.name}.name`
                              ? i18n.__(`status.${status.name}.name`) : status.name,
                descriptionStatus: i18n.__(`status.${status.name}.description`) !==
                `status.${status.name}.description`
                  ? i18n.__(`status.${status.name}.description`) : status.description,
                colorStatus: status.color,
                iconStatus: status.icon
            };
        });
    } catch (error) {
        logger.error('Error en getStatus:', error);
        throw new Error('Error al obtener estados');
    }
    }
}

    module.exports = StatusService;
