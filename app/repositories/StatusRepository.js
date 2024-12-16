const { Op } = require('sequelize');
const { Status } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

const StatusRepository = {
  // Obtener todos los estados
  async findAll() {
    return await Status.findAll({
      attributes: ['id', 'name', 'description', 'color', 'icon', 'type'],
    });
  },

  // Buscar un estado por ID
  async findById(id) {
    return await Status.findByPk(id, {
      attributes: ['id', 'name', 'description', 'color', 'icon', 'type'],
    });
  },

  // Verificar si existe un estado con un nombre específico (excluyendo un ID opcional)
  async existsByName(name, excludeId = null) {
    const whereCondition = excludeId
      ? { name, id: { [Op.ne]: excludeId } }
      : { name };
    return await Status.findOne({ where: whereCondition });
  },

  // Crear un nuevo estado
  async create(body) {
    const { name, description, color, icon, type } = body;
    try {
      return await Status.create({
        name,
        description,
        color,
        icon,
        type,
      });
    } catch (err) {
      logger.error(`Error al crear Status: ${err.message}`);
      throw new Error('Error al crear el estado');
    }
  },

  // Actualizar un estado
  async update(status, body) {
    // Lista de campos que pueden ser actualizados
    const fieldsToUpdate = ['name', 'description', 'color', 'icon', 'type'];

    // Filtrar los campos presentes en req.body y construir el objeto updatedData
    const updatedData = Object.keys(body)
        .filter(key => fieldsToUpdate.includes(key) && body[key] !== undefined)
        .reduce((obj, key) => {
            obj[key] = body[key];
            return obj;
        }, {});

    // Actualizar solo si hay datos que cambiar
    if (Object.keys(updatedData).length > 0) {
        await status.update(updatedData);
        logger.info(`Estado actualizado exitosamente: ${status.name} (ID: ${status.id})`);
    }

    return status;
},

  // Eliminar un estado
  async delete(status) {
    try {
      return await status.destroy();
    } catch (err) {
      logger.error(`Error al eliminar Status: ${err.message}`);
      throw new Error('Error al eliminar el estado');
    }
  },
};

module.exports = StatusRepository;
