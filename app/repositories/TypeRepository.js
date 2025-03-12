const { Op } = require('sequelize');
const { Type } = require('../models'); // Usamos el modelo Type
const logger = require('../../config/logger'); // Logger para seguimiento

const TypeRepository = {
  // Obtener todos los tipos
  async findAll() {
    return await Type.findAll({
      attributes: ['id', 'name', 'description', 'type'], // Seleccionamos los campos
    });
  },

  // Buscar un tipo por ID
  async findById(id) {
    return await Type.findByPk(id, {
      attributes: ['id', 'name', 'description', 'type'], // Seleccionamos los campos
    });
  },

  // Buscar un tipo por nombre, excluyendo un tipo específico
  async existsByName(name, excludeId = null) {
    const whereCondition = excludeId ? { name, id: { [Op.ne]: excludeId } } : { name };
    return await Type.findOne({ where: whereCondition });
  },

  // Crear un nuevo tipo
  async create(body) {
    const { name, description, type } = body;

    const newType = await Type.create({
      name,
      description,
      type,
    });

    return newType;
  },

  // Actualizar un tipo
  async update(typeInstance, body) {
    const fieldsToUpdate = ['name', 'description', 'type']; // Campos que se pueden actualizar

    const updatedData = Object.keys(body)
      .filter((key) => fieldsToUpdate.includes(key) && body[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    if (Object.keys(updatedData).length > 0) {
      await typeInstance.update(updatedData);
      logger.info(`Tipo actualizado exitosamente (ID: ${typeInstance.id})`);
    }

    return typeInstance;
  },

  // Eliminar un tipo
  async delete(typeInstance) {
    return await typeInstance.destroy();
  },

  // Buscar tipos por tipo (Salud o Tarea)
  async findByType(type) {
    return await Type.findAll({
      where: { type },
      attributes: ['id', 'name', 'description', 'type'],
    });
  },
};

module.exports = TypeRepository;