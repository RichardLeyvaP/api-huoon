// services/CategoryService.js

const { Op } = require('sequelize');
const { Role } = require('../models'); // Importa tus modelos
const logger = require('../../config/logger'); // Importa el logger
const i18n = require('../../config/i18n-config');

class RoleService {
  // Método para obtener categorías
  static async getRoles(type) {
    logger.info(`Entra a Buscar Los roles de ${type}`);
    try {
        const roles = await Role.findAll({
            where: { type: type }
        });

        return roles.map(role => {
            return {
                id: role.id,
                nameRol: i18n.__(`roles.${role.name}.name`) !== `roles.${role.name}.name`
                ? i18n.__(`roles.${role.name}.name`)
                : role.name,
                descriptionRol: i18n.__(`roles.${role.name}.name`) !== `roles.${role.name}.name`
                ? i18n.__(`roles.${role.name}.description`)
                : role.description
            };
        });
    } catch (error) {
        logger.error('Error en getRoles:', error);
        throw new Error('Error al obtener los roles');
    }
    }
}

    module.exports = RoleService;
