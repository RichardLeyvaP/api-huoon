const { Op } = require('sequelize');
const { HomeType } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

const HomeTypeRepository = {
  // Obtener todos los tipos de hogar
  async findAll() {
    return await HomeType.findAll({
      attributes: ['id', 'name', 'description', 'icon'],
    });
  },

  // Buscar un tipo de hogar por ID
  async findById(id) {
    return await HomeType.findByPk(id, {
      attributes: ['id', 'name', 'description', 'icon'],
    });
  },

  // Verificar si existe un tipo de hogar con un nombre específico (excluyendo un ID opcional)
  async existsByName(name, excludeId = null) {
    const whereCondition = excludeId
      ? { name, id: { [Op.ne]: excludeId } }
      : { name };
    return await HomeType.findOne({ where: whereCondition });
  },

  // Crear un nuevo tipo de hogar
  async create(body) {
    const { name, description, icon } = body;
    try {
      return await HomeType.create({
        name,
        description,
        icon,
      });
    } catch (err) {
      logger.error(`Error al crear HomeType: ${err.message}`);
      throw new Error('Error al crear el tipo de hogar');
    }
  },

  // Actualizar un tipo de hogar
  async update(homeType, body) {
    const { name, description, icon } = body;

    try {
      homeType.name = name || homeType.name;
      homeType.description = description || homeType.description;
      homeType.icon = icon || homeType.icon;
      await homeType.save();

      return homeType;
    } catch (err) {
      logger.error(`Error al actualizar HomeType: ${err.message}`);
      throw new Error('Error al actualizar el tipo de hogar');
    }
  },

  // Eliminar un tipo de hogar
  async delete(homeType) {
    try {
      await homeType.destroy();
    } catch (err) {
      logger.error(`Error al eliminar HomeType: ${err.message}`);
      throw new Error('Error al eliminar el tipo de hogar');
    }
  },
};

module.exports = HomeTypeRepository;
