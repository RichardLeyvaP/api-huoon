const { Op } = require('sequelize');
const { Priority } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

const PriorityRepository = {
  // Obtener todas las prioridades
  async findAll() {
    return await Priority.findAll({
      attributes: ['id', 'name', 'level', 'color', 'description'],
    });
  },

  // Buscar una prioridad por ID
  async findById(id) {
    return await Priority.findByPk(id, {
      attributes: ['id', 'name', 'level', 'color', 'description'],
    });
  },

  // Verificar si existe una prioridad con un nombre específico (excluyendo un ID opcional)
  async existsByName(name, excludeId = null) {
    const whereCondition = excludeId
      ? { name, id: { [Op.ne]: excludeId } }
      : { name };
    return await Priority.findOne({ where: whereCondition });
  },

  // Crear una nueva prioridad
  async create(body) {
    const { name, level, color, description } = body;
    try {
      return await Priority.create({
        name,
        level,
        color,
        description,
      });
    } catch (err) {
      logger.error(`Error al crear Priority: ${err.message}`);
      throw new Error('Error al crear la prioridad');
    }
  },

  // Actualizar una prioridad
  async update(priority, body) {
    // Lista de campos que pueden ser actualizados
    const fieldsToUpdate = ['name', 'level', 'color', 'description'];

    // Filtrar los campos presentes en req.body y construir el objeto updatedData
    const updatedData = Object.keys(body)
      .filter(key => fieldsToUpdate.includes(key) && body[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    // Actualizar solo si hay datos que cambiar
    if (Object.keys(updatedData).length > 0) {
      await priority.update(updatedData);
      logger.info(`Prioridad actualizada exitosamente: ${priority.name} (ID: ${priority.id})`);
    }

    return priority;
  },

  // Eliminar una prioridad
  async delete(priority) {
    try {
      return await priority.destroy();
    } catch (err) {
      logger.error(`Error al eliminar Priority: ${err.message}`);
      throw new Error('Error al eliminar la prioridad');
    }
  },
};

module.exports = PriorityRepository;
