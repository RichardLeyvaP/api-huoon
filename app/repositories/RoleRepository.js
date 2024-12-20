const { Op } = require('sequelize');
const { Role } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

const RoleRepository = {
  // Obtener todos los roles
  async findAll() {
    return await Role.findAll({
      attributes: ['id', 'name', 'description', 'type'],
    });
  },

  // Buscar un rol por ID
  async findById(id) {
    return await Role.findByPk(id, {
      attributes: ['id', 'name', 'description', 'type'],
    });
  },

  // Verificar si existe un rol con un nombre específico (excluyendo un ID opcional)
  async existsByName(name, excludeId = null) {
    const whereCondition = excludeId
      ? { name, id: { [Op.ne]: excludeId } }
      : { name };
    return await Role.findOne({ where: whereCondition });
  },

  // Crear un nuevo rol
  async create(body) {
    const { name, description, type } = body;
    //type = type ? type : "Sistema"
    try {
      return await Role.create({
        name,
        description,
        type,
      });
    } catch (err) {
      logger.error(`Error al crear Role: ${err.message}`);
      throw new Error('Error al crear el rol');
    }
  },

  // Actualizar un rol
  async update(role, body) {
    // Lista de campos que pueden ser actualizados
    const fieldsToUpdate = ['name', 'description', 'type'];

    // Filtrar los campos presentes en req.body y construir el objeto updatedData
    const updatedData = Object.keys(body)
      .filter(key => fieldsToUpdate.includes(key) && body[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    // Actualizar solo si hay datos que cambiar
    if (Object.keys(updatedData).length > 0) {
      await role.update(updatedData);
      logger.info(`Rol actualizado exitosamente: ${role.name} (ID: ${role.id})`);
    }

    return role;
  },

  // Eliminar un rol
  async delete(role) {
    try {
      return await role.destroy();
    } catch (err) {
      logger.error(`Error al eliminar Role: ${err.message}`);
      throw new Error('Error al eliminar el rol');
    }
  },
};

module.exports = RoleRepository;
