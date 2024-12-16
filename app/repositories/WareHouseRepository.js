const { Op } = require('sequelize');
const { Warehouse } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

const WarehouseRepository = {
  // Obtener todos los almacenes
  async findAll() {
    return await Warehouse.findAll({
      attributes: ['id', 'title', 'description', 'location', 'status'],
    });
  },

  // Buscar un almacén por ID
  async findById(id) {
    return await Warehouse.findByPk(id, {
      attributes: ['id', 'title', 'description', 'location', 'status'],
    });
  },

  // Verificar si existe un almacén con un título específico (excluyendo un ID opcional)
  async existsByTitle(title, excludeId = null) {
    const whereCondition = excludeId
      ? { title, id: { [Op.ne]: excludeId } }
      : { title };
    return await Warehouse.findOne({ where: whereCondition });
  },

  // Crear un nuevo almacén
  async create(body) {
    const { title, description, location, status } = body;
    try {
      return await Warehouse.create({
        title,
        description,
        location,
        status,
      });
    } catch (err) {
      logger.error(`Error al crear Warehouse: ${err.message}`);
      throw new Error('Error al crear el almacén');
    }
  },

  // Actualizar un almacén
  async update(warehouse, body) {
    // Lista de campos que pueden ser actualizados
    const fieldsToUpdate = ['title', 'description', 'location', 'status'];

    // Filtrar los campos presentes en req.body y construir el objeto updatedData
    const updatedData = Object.keys(body)
      .filter(key => fieldsToUpdate.includes(key) && body[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    // Actualizar solo si hay datos que cambiar
    if (Object.keys(updatedData).length > 0) {
      await warehouse.update(updatedData);
      logger.info(`Almacén actualizado exitosamente: ${warehouse.title} (ID: ${warehouse.id})`);
    }

    return warehouse;
  },

  // Eliminar un almacén
  async delete(warehouse) {
    try {
      return await warehouse.destroy();
    } catch (err) {
      logger.error(`Error al eliminar Warehouse: ${err.message}`);
      throw new Error('Error al eliminar el almacén');
    }
  },
  async findByStatus(status) {
    logger.info('Entra a Buscar Los tipos de hogar en (findByType)');
    try {
        return await Warehouse.findAll({
          where: { status: status }
      });
    } catch (error) {
        logger.error('Error en getStatus:', error);
        throw new Error('Error al obtener estados');
    }
  },
};

module.exports = WarehouseRepository;
