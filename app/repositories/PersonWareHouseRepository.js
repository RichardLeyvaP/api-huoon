const { Op } = require('sequelize');
const { Warehouse, Home, PersonWarehouse, Person, HomePerson, HomeWarehouse, sequelize } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

const PersonWareHouseRepository = {
  // Obtener todos los almacenes
  async findAll() {
    return await PersonWarehouse.findAll({
      include: [
        {
            model: Home,
            as: 'home', // Asociación con el modelo Home
            attributes: ['id', 'name'] // Puedes ajustar los atributos que quieres devolver
        },
        {
            model: Warehouse,
            as: 'warehouse', // Asociación con el modelo Warehouse
            attributes: ['id', 'title', 'description', 'location', 'status'] // Ajustar según los atributos que desees
        }
    ]
    });
  },

  // Buscar un almacén por ID
  async findById(id) {
    return await PersonWarehouse.findByPk(id, {
      include: [
        {
            model: Home,
            as: 'home', // Asociación con el modelo Home
            attributes: ['id', 'name'] // Puedes ajustar los atributos que quieres devolver
        },
        {
            model: Warehouse,
            as: 'warehouse', // Asociación con el modelo Warehouse
            attributes: ['id', 'title', 'description', 'location', 'status'] // Ajustar según los atributos que desees
        }
    ]
    });
  },

  // Crear un nuevo almacén
  async create(body, warehouse, person_id, t) {
    const { title, description, location, status, home_id } = body;
    try {
      if (!warehouse) {    
        logger.info('PersonWarehouseController->store: Creando nuevo almacén');
        warehouse = await Warehouse.create({
            title: title,
            description: description,
            location: location,
            status: 0 // Estado por defecto 0 para nuevos almacenes no asociados
        }, { transaction: t });
    }

    // Asociar el almacén a la persona dentro del hogar en `person_warehouse`
    const [personWarehouse, created] = await PersonWarehouse.findOrCreate({
        where: {
            person_id: person_id,
            warehouse_id: warehouse.id,
            home_id: home_id // Relacionamos con el hogar correcto
        },
        defaults: {
            title: title || warehouse.title,
            description: description || warehouse.description,
            location: location || warehouse.location,
            status: status !== undefined ? status : 0,
        },
        transaction: t
    });

    return personWarehouse;
    } catch (err) {
      logger.error(`Error al crear Warehouse: ${err.message}`);
      throw new Error('Error al crear el almacén');
    }
  },

  // Actualizar un almacén
  async update(personWarehouse, body, t) {
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
      await personWarehouse.update(updatedData, { transaction: t });
      logger.info(`Almacén personalizado actualizado exitosamente: ${personWarehouse.title} (ID: ${personWarehouse.id})`);
    }

    return personWarehouse;
  },

  // Eliminar un almacén
  async delete(personWarehouse, t) {
    try {
      return await personWarehouse.destroy({transaction: t});
    } catch (err) {
      logger.error(`Error al eliminar PersonWarehouse: ${err.message}`);
      throw new Error('Error al eliminar el almacén');
    }
  },
};

module.exports = PersonWareHouseRepository;
