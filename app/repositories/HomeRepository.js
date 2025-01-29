const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const {
  Home,
  HomeType,
  Status,
  HomePerson,
  Role,
  Person,
  sequelize,
} = require("../models");
const logger = require("../../config/logger"); // Logger para seguimiento
const i18n = require("../../config/i18n-config");
const e = require("express");
const ImageService = require("../services/ImageService");

const HomeRepository = {
  // Obtener todas las casas
  async findAll() {
    return await Home.findAll({
      attributes: [
        "id",
        "name",
        "address",
        "geo_location",
        "timezone",
        "image",
        "residents",
        "home_type_id",
        "status_id",
      ],
      include: [
        {
          model: HomeType,
          as: "homeType",
          attributes: ["id", "name"],
        },
        {
          model: Status,
          as: "status",
          attributes: ["id", "name", "description"],
        },
      ],
    });
  },

  async findAllHomes(personId) {
    return await Home.findAll({
      where: {
        [Op.or]: [
          { person_id: personId }, // Relación directa con la persona
          sequelize.literal(`EXISTS (
            SELECT 1
            FROM home_person
            WHERE home_person.home_id = Home.id
            AND home_person.person_id = ${personId}
          )`), // Relación indirecta a través de la tabla intermedia home_person
        ],
      },
      include: [
        {
          model: HomePerson,
          as: "homePersons",
          include: [
            {
              model: Role,
              as: "role", // Incluir los detalles del rol
              attributes: ["id", "name", "description"],
            },
          ],
          where: { person_id: personId }, // Filtrar solo las relaciones relevantes
          required: false, // Permitir hogares sin una relación en home_person
        },
        {
          model: HomeType,
          as: "homeType", // Incluir tipo de hogar
          attributes: ["id", "name"],
        },
        {
          model: Status,
          as: "status", // Incluir estado del hogar
          attributes: ["id", "name", "description"],
        },
      ],
    });
  },

  async peopleHome(home, personId) {
    const homePersons = await HomePerson.findAll({
      where: { home_id: home.id },
      include: [
        {
            model: Role,
            as: 'role',
            attributes: ['id', 'name']
        },
        {
            model: Person,
            as: 'person',
            attributes: ['id', 'name', 'email', 'image']
        }
    ]
    });

    // Devolver las personas mapeadas
    let people = homePersons.map((homePerson) => ({
      id: homePerson.person_id,
      name: homePerson.person.name,
      image: homePerson.person.image,
      roleId: homePerson.role_id,
      role_id: homePerson.role_id,
      roleName:
        i18n.__(`roles.${homePerson.role.name}.name`) !==
        `roles.${homePerson.role.name}.name`
          ? i18n.__(`roles.${homePerson.role.name}.name`) // Traducción del rol si está disponible
          : homePerson.role.name,
    }));
    
    // Verificar si la persona que hace la consulta tiene relación directa con la tarea
    const personAlreadyIncluded = people.some(
      (person) => person.id === personId
    );
    // Si la persona no está relacionada, se agrega solo como "Creador"
    if (!personAlreadyIncluded && home.person_id === personId) {
      const person = await Person.findByPk(personId); // Obtener los detalles de la persona
      if (person) {
        people.push({
          id: home.person_id,
          name: person.name,
          image: person.image,
          roleId: 0,
          role_d: 0,
          roleName:
            i18n.__(`roles.${"Creador"}.name`) !== `roles.${"Creador"}.name`
              ? i18n.__(`roles.${"Creador"}.name`) // Traducción del rol si está disponible
              : "Creador",
        });
      }
    }

    return people;
  },

  // Buscar una casa por ID
  async findById(id) {
    return await Home.findByPk(id, {
      attributes: [
        "id",
        "name",
        "address",
        "geo_location",
        "timezone",
        "image",
        "residents",
        "home_type_id",
        "status_id",
        "person_id",
      ],
      include: [
        {
          model: HomeType,
          as: "homeType",
          attributes: ["id", "name"],
        },
        {
          model: Status,
          as: "status",
          attributes: ["id", "name", "description"],
        },
      ],
    });
  },

  // Crear una nueva casa con manejo de imágenes
  async create(body, file, t) {
    const {
      name,
      address,
      geo_location,
      timezone,
      residents,
      home_type_id,
      status_id,
      person_id
    } = body;
    const home = await Home.create(
      {
        name,
        address,
        geo_location,
        timezone,
        residents,
        home_type_id,
        status_id,
        person_id,
        image: "homes/default.jpg", // Imagen predeterminada
      },
      { transaction: t }
    );

    // Manejar archivo si se proporciona
    if (file) {
      const newFilename = ImageService.generateFilename(
        "homes",
        home.id,
        file.originalname
      );
      home.image = await ImageService.moveFile(file, newFilename);
      await home.update(
        { image: home.image },
        { transaction: t }
      );
    }
    return home;
  },

  // Actualizar una casa con manejo de imágenes
  async update(home, body, file, t) {
    const fieldsToUpdate = [
      "name",
      "address",
      "geo_location",
      "timezone",
      "residents",
      "home_type_id",
      "status_id",
      "image",
      "person_id"
    ];

    const updatedData = Object.keys(body)
      .filter((key) => fieldsToUpdate.includes(key) && body[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    try {
      // Manejar el archivo si se proporciona
      if (file) {
        if (home.image && home.image !== "homes/default.jpg") {
          await ImageService.deleteFile(home.image);
        }
        const newFilename = ImageService.generateFilename(
          "homes",
          home.id,
          file.originalname
        );
        updatedData.image = await ImageService.moveFile(
          file,
          newFilename
        );
      }

      // Actualizar los datos en la base de datos si hay cambios
      if (Object.keys(updatedData).length > 0) {
        await home.update(updatedData, { transaction: t }); // Usar la transacción
        logger.info(`Casa actualizada exitosamente (ID: ${home.id})`);
      }

      return home;
    } catch (err) {
      logger.error(`Error en HomeRepository->update: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  },

  async syncHomePeople(homeId, peopleArray, t) {
    // Obtener las asociaciones actuales para la tarea especificada
    const currentAssociations = await HomePerson.findAll({
      where: { home_id: homeId },
    });

    const currentMap = currentAssociations.reduce((map, assoc) => {
      map[`${assoc.person_id}-${assoc.home_id}`] = assoc; // Guardamos el objeto completo en el mapa
      return map;
    }, {});

    // Crear un mapa del nuevo conjunto de datos (key: person_id-home_id)
    const newMap = peopleArray.reduce((map, person) => {
      map[`${person.person_id}-${person.home_id}`] = person;
      return map;
    }, {});

    const toAdd = [];
    const toUpdate = [];
    const toDelete = [];
    const actions = []; // Array para registrar las acciones realizadas

    // Recorremos las nuevas asociaciones para determinar si agregar o actualizar
    Object.keys(newMap).forEach((key) => {
      const incoming = newMap[key];

      // Verificar si ya existe una relación para esta combinación
      const current = currentMap[key];

      if (!current) {
        // Si la asociación no existe en la base de datos, agregarla
        toAdd.push({
          home_id: homeId,
          ...incoming,
        });
      } else {
        // Si la asociación existe pero el rol ha cambiado, la actualizamos
        if (current.role_id !== incoming.role_id) {
          toUpdate.push({
            id: current.id, // Usamos el id de la relación actual
            role_id: incoming.role_id,
          });
        }
      }
    });

    // Recorremos las asociaciones actuales para eliminar las que ya no existen en el nuevo conjunto
    currentAssociations.forEach((current) => {
      const key = `${current.person_id}-${current.home_id}`;
      if (!newMap[key]) {
        toDelete.push(current.id);
      }
    });

    // Aplicar las operaciones: eliminar, actualizar, agregar
    if (toDelete.length > 0) {
      await HomePerson.destroy({
        where: { id: toDelete },
        transaction: t,
      });
      actions.push({ action: "deleted", ids: toDelete });
    }

    if (toUpdate.length > 0) {
      for (const update of toUpdate) {
        await HomePerson.update(
          { role_id: update.role_id },
          { where: { id: update.id }, transaction: t }
        );
      }
      actions.push({ action: "updated", ids: toUpdate.map((u) => u.id) });
    }

    if (toAdd.length > 0) {
      await HomePerson.bulkCreate(toAdd, { transaction: t });
      actions.push({ action: "added", ids: toAdd.map((a) => a.id) });
    }

    // Devolver detalles de las operaciones realizadas
    return { toAdd, toUpdate, toDelete, actions };
  },

  // Eliminar una casa
  async delete(home) {
    if (home.image && home.image !== "homes/default.jpg") {
      await ImageService.deleteFile(home.image);
    }

    return await home.destroy();
  },
};

module.exports = HomeRepository;
