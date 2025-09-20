const { Op } = require("sequelize");
const {
  Warehouse,
  Home,
  PersonWarehouse,
  Person,
  HomePerson,
  HomeWarehouse,
  sequelize,
} = require("../models");
const logger = require("../../config/logger"); // Logger para seguimiento
const { error } = require("winston");

const PersonWareHouseRepository = {
  // Obtener todos los almacenes
  async findAll() {
    return await PersonWarehouse.findAll({
      include: [
        {
          model: Home,
          as: "home", // Asociación con el modelo Home
          attributes: ["id", "name"], // Puedes ajustar los atributos que quieres devolver
        },
        {
          model: Warehouse,
          as: "warehouse", // Asociación con el modelo Warehouse
          attributes: ["id", "title", "description", "location", "status"], // Ajustar según los atributos que desees
        },
      ],
    });
  },

  /*async selectWarehouses(homeId, personId) {
    const warehouses = await Warehouse.findAll({
      where: {
          // No limitamos el status aquí porque lo vamos a manejar con los filtros de la relación
      },
      include: [
          {
              model: PersonWarehouse,
              as: "personWarehouses",
              required: false, // LEFT JOIN para incluir almacenes que no tienen relación
              where: {
                  home_id: homeId, // Relacionado con el hogar
                  [Op.or]: [
                      { person_id: personId }, // Si el almacén tiene relación con la persona
                      {
                          person_id: { [Op.ne]: personId }, // Si no tiene relación con la persona
                          status: [1,2], // Solo incluir si el status es 1 (para los que no tienen relación)
                      },
                  ],
              },
          },
      ],
  });

  return warehouses;
  },*/

  /*async gettWarehouses(home_id, personId, type = null) {
    const warehouses = await PersonWarehouse.findAll({
      where: {
        home_id: home_id, // Solo registros de este hogar
        [Op.or]: [
          // 1. Son míos → los muestro sin importar el status (0,1,2)
          {
            person_id: personId,
            status: { [Op.in]: [0, 1, 2] },
          },
          // 2. Son de otros → solo los muestro si status es 1 o 2
          {
            person_id: { [Op.ne]: personId },
            status: { [Op.in]: [1, 2] },
          },
        ],
      },
      attributes: [
        "id",
        "warehouse_id",
        "title",
        "description",
        "location",
        "status",
        "person_id",
        "home_id", // Opcional: para depuración
      ],
      include: [
        {
          model: Warehouse,
          as: "warehouse",
          attributes: [],
        },
      ],
    });

    return warehouses;
  },*/

  async gettWarehouses(home_id, personId, type = null) {
  let whereCondition = {
    home_id: home_id,
  };

  if (type === 'Personal') {
    // ✅ SOLO almacenes PRIVADOS del usuario (status = 0)
    whereCondition = {
      ...whereCondition,
      person_id: personId,
      status: 0, // ← ¡Clave! Solo los privados
    };
  } else if (type === 'Hogar') {
    // ✅ SOLO almacenes del HOGAR (status 1 o 2), excluyendo los privados del usuario
    whereCondition = {
      ...whereCondition,
      status: { [Op.in]: [1, 2] }, // ← Solo públicos/compartidos
      // Opcional: si quieres EXCLUIR explícitamente los privados del usuario, añade:
      // [Op.or]: [
      //   { person_id: { [Op.ne]: personId } },
      //   { person_id: personId, status: { [Op.in]: [1, 2] } } // Incluye los tuyos si son públicos
      // ]
    };
  } else {
    // Comportamiento original (todos los que la persona puede ver)
    whereCondition = {
      ...whereCondition,
      [Op.or]: [
        {
          person_id: personId,
          status: { [Op.in]: [0, 1, 2] }, // El usuario ve todos sus almacenes
        },
        {
          status: { [Op.in]: [1, 2] }, // Ve almacenes de otros solo si son públicos
        },
      ],
    };
  }

  const warehouses = await PersonWarehouse.findAll({
    where: whereCondition,
    attributes: [
      "id",
      "warehouse_id",
      "title",
      "description",
      "location",
      "status",
      "person_id",
      "home_id",
    ],
    include: [
      {
        model: Warehouse,
        as: "warehouse",
        attributes: [],
      },
    ],
  });

  return warehouses;
},
  // Buscar un almacén por ID
  async findById(id) {
    return await PersonWarehouse.findByPk(id, {
      include: [
        {
          model: Home,
          as: "home", // Asociación con el modelo Home
          attributes: ["id", "name"], // Puedes ajustar los atributos que quieres devolver
        },
        {
          model: Warehouse,
          as: "warehouse", // Asociación con el modelo Warehouse
          attributes: ["id", "title", "description", "location", "status"], // Ajustar según los atributos que desees
        },
      ],
    });
  },

  // Crear un nuevo almacén
  async create(body, warehouse, person_id, t) {
    const { title, description, location, status, home_id } = body;
    try {
      if (!warehouse) {
        logger.info("PersonWarehouseController->store: Creando nuevo almacén");
        warehouse = await Warehouse.create(
          {
            title: title,
            description: description,
            location: location,
            status: 0, // Estado por defecto 0 para nuevos almacenes no asociados
          },
          { transaction: t }
        );
      }

      // Asociar el almacén a la persona dentro del hogar en `person_warehouse`
      const [personWarehouse, created] = await PersonWarehouse.findOrCreate({
        where: {
          person_id: person_id,
          warehouse_id: warehouse.id,
          home_id: home_id, // Relacionamos con el hogar correcto
        },
        defaults: {
          title: title || warehouse.title,
          description: description || warehouse.description,
          location: location || warehouse.location,
          status: status ?? 0
        },
        transaction: t,
      });

      return personWarehouse;
    } catch (err) {
      logger.error(`Error al crear PersonWarehouse: ${err.message}`);
      throw err;
    }
  },

  // Actualizar un almacén
  async update(personWarehouse, body, t) {
    try {
      // Lista de campos que pueden ser actualizados
      const fieldsToUpdate = ["title", "description", "location", "status"];

      // Filtrar los campos presentes en req.body y construir el objeto updatedData
      const updatedData = Object.keys(body)
        .filter(
          (key) => fieldsToUpdate.includes(key) && body[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      // Actualizar solo si hay datos que cambiar
      if (Object.keys(updatedData).length > 0) {
        await personWarehouse.update(updatedData, { transaction: t });
        logger.info(
          `Almacén personalizado actualizado exitosamente: ${personWarehouse.title} (ID: ${personWarehouse.id})`
        );
      }
      return personWarehouse;
    } catch (error) {
      logger.error(`Error al editar PersonWarehouse: ${error.message}`);
      throw error;
    }
  },

  // Eliminar un almacén
  async delete(personWarehouse) {
    try {
      return await personWarehouse.destroy();
    } catch (err) {
      logger.error(`Error al eliminar PersonWarehouse: ${err.message}`);
      throw new Error("Error al eliminar el almacén");
    }
  },
};

module.exports = PersonWareHouseRepository;
