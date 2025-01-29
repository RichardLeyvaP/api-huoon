const { Person, Role, HomePerson, sequelize } = require("../models"); // Importar el modelo Home
const logger = require("../../config/logger"); // Importa el logger
const i18n = require("../../config/i18n-config");
const { StatusService, RoleService } = require("../services");
const {
  HomeRepository,
  HomeTypeRepository,
  StatusRepository,
  WareHouseRepository,
} = require("../repositories");

const HomeController = {
  // Obtener todas las casas
  async index(req, res) {
    logger.info(`${req.user.name} - Entra a buscar las casas`);

    try {
      const homes = await HomeRepository.findAll();

      if (!homes.length) {
        return res.status(204).json({ msg: "HomesNotFound" });
      }

      // Mapear la respuesta
      const mappedHomes = homes.map((home) => {
        const homeType = home.homeType; // Obtener el tipo de casa relacionado
        return {
          id: home.id,
          statusId: home.status_id,
          name: home.name,
          address: home.address,
          homeTypeId: home.home_type_id,
          nameHomeType: homeType ? homeType.name : null, // Manejo de caso cuando no hay tipo de casa
          residents: home.residents,
          geoLocation: home.geo_location,
          timezone: home.timezone,
          nameStatus: home.status.name, // Aquí asumo que tienes una propiedad status directa en el modelo
          image: home.image,
        };
      });

      res.status(200).json({ homes: mappedHomes });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getHomes(req, res) {
    logger.info(`${req.user.name} - Entra a buscar las hogares`); // Registro de la acción

    try {
      const personId = req.person.id;
      // Obtener solo las tareas principales (sin padre) directamente en la consulta
      const homes = await HomeRepository.findAllHomes(personId);

      if (!homes.length) {
        return res.status(204).json({ msg: "HomeNotFound", homes: homes });
      }
      // Mapear las tareas
      const mappedHomes = await Promise.all(
        homes.map(async (home) => {
          return {
            id: home.id,
            statusId: home.status_id,
            status_id: home.status_id,
            name: home.name,
            address: home.address,
            homeTypeId: home.home_type_id,
            home_type_id: home.home_type_id,
            nameHomeType: home.homeType.name, // Manejo de caso cuando no hay tipo de casa
            residents: home.residents,
            geoLocation: home.geo_location,
            geo_location: home.geo_location,
            timezone: home.timezone,
            nameStatus: home.status.name, // Aquí asumo que tienes una propiedad status directa en el modelo
            image: home.image,
            // Personas relacionadas con la tarea
            people: await HomeRepository.peopleHome(home, personId),
          };
        })
      );

      return res.status(200).json({ homes: mappedHomes }); // Tareas encontradas
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->getHomes: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Crear una nueva casa
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva casa`);
    logger.info("datos recibidos al crear un hogar");
    logger.info(JSON.stringify(req.body));

    const {
      name,
      address,
      home_type_id,
      residents,
      geo_location,
      timezone,
      status_id,
      image,
      people,
    } = req.body;

    const personId = req.person.id;
    req.body.person_id = personId;
    // Verificar si el tipo de hogar existe
    const homeType = await HomeTypeRepository.findById(home_type_id);
    if (!homeType) {
      logger.error(
        `HomeController->store: Typo de Hogar no encontrado con ID ${home_type_id}`
      );
      return res.status(404).json({ msg: "TypeHomeNotFound" });
    }
    // Verificar si el estado exista
    const status = await StatusRepository.findById(status_id);
    if (!status) {
      logger.error(
        `HomeController->store: Estado no encontrado con ID ${status_id}`
      );
      return res.status(404).json({ msg: "StatusNotFound" });
    }

    let filteredPeople = [];
    if (req.body.people && req.body.people.length > 0) {
      // Filtrar las personas con role_id != 0
      filteredPeople = req.body.people.filter(
        (person) => parseInt(person.role_id) !== 0
      );

      // Si no quedan personas después del filtrado, devolver un error
      if (filteredPeople.length === 0) {
        return res
          .status(400)
          .json({ msg: "No se han proporcionado personas válidas." });
      }

      const personIds = filteredPeople.map((person) =>
        parseInt(person.person_id)
      );
      const roleIds = filteredPeople.map((person) => parseInt(person.role_id));

      // Verificar personas, roles y hogares
      const [persons, roles] = await Promise.all([
        Person.findAll({ where: { id: personIds } }),
        Role.findAll({ where: { id: roleIds } }),
      ]);
      // Comprobar si alguna entidad no existe
      const missingPersons = personIds.filter(
        (id) => !persons.find((p) => p.id === id)
      );
      const missingRoles = roleIds.filter(
        (id) => !roles.find((r) => r.id === id)
      );

      if (missingPersons.length || missingRoles.length) {
        logger.error(`No se encontraron personas o roles con los siguientes IDs: 
                            Personas: ${missingPersons}, Roles: ${missingRoles}`);
        return res
          .status(400)
          .json({ msg: "Datos no encontrados para algunas asociaciones." });
      }
    }

    const t = await sequelize.transaction();
    try {
      const home = await HomeRepository.create(req.body, req.file, t);
      if (filteredPeople.length > 0) {
        // Crear las asociaciones en paralelo
        for (const person of filteredPeople) {
          const { person_id, role_id } = person;

          const homePerson = await HomePerson.create(
            {
              home_id: home.id,
              person_id,
              role_id,
            },
            { transaction: t }
          );
        }
      }
      await t.commit();
      res.status(201).json({ home });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async show(req, res) {
    logger.info(`${req.user.name} - Entra a buscar un home`);
    const id = req.body.id; // Asegúrate de convertir a número

    try {
      const home = await HomeRepository.findById(req.body.id);

      if (!home) {
        return res.status(404).json({ msg: "HomeNotFound" });
      }

      const mappedHome = {
        id: home.id,
        statusId: home.status_id,
        name: home.name,
        address: home.address,
        homeTypeId: home.home_type_id,
        nameHomeType: home.homeType ? home.homeType.name : null,
        residents: home.residents,
        geoLocation: home.geo_location,
        timezone: home.timezone,
        nameStatus: home.status.name,
        image: home.image,
      };

      res.status(200).json({ homes: mappedHome });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar una casa
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza el home con ID ${req.body.id}`);
    logger.info("datos recibidos al editar un hogar");
    logger.info(JSON.stringify(req.body));
    const personId = req.person.id;

    const home = await HomeRepository.findById(req.body.id);

    if (!home) {
      logger.error(
        `HomeController->update: Hogar no encontrado con ID ${req.body.id}`
      );
      return res.status(404).json({ msg: "HomeNotFound" });
    }

    if (req.body.status_id) {
      // Verificar si el estado exista
      const status = await StatusRepository.findById(req.body.status_id);
      if (!status) {
        logger.error(
          `HomeController->update: Estado no encontrado con ID ${req.body.status_id}`
        );
        return res.status(404).json({ msg: "StatusNotFound" });
      }
    }

    if (req.body.home_type_id) {
      // Verificar si el estado exista
      const homeType = await HomeTypeRepository.findById(req.body.home_type_id);
      if (!homeType) {
        logger.error(
          `HomeController->update: Tipo de hogar no encontrado con ID ${req.body.home_type_id}`
        );
        return res.status(404).json({ msg: "HomeTypeNotFound" });
      }
    }

    let filteredPeople = [];
    if (req.body.people && req.body.people.length > 0) {
      // Filtrar las personas con role_id != 0
      filteredPeople = req.body.people.filter(
        (person) => parseInt(person.role_id) !== 0
      );

      // Si no quedan personas después del filtrado, devolver un error
      if (filteredPeople.length === 0) {
        return res
          .status(400)
          .json({ msg: "No se han proporcionado personas válidas." });
      }
      const personIds = filteredPeople.map((person) =>
        parseInt(person.person_id)
      );
      const roleIds = filteredPeople.map((person) => parseInt(person.role_id));

      // Verificar personas, roles y hogares
      const [persons, roles] = await Promise.all([
        Person.findAll({ where: { id: personIds } }),
        Role.findAll({ where: { id: roleIds } }),
      ]);
      // Comprobar si alguna entidad no existe
      const missingPersons = personIds.filter(
        (id) => !persons.find((p) => p.id === id)
      );
      const missingRoles = roleIds.filter(
        (id) => !roles.find((r) => r.id === id)
      );

      if (missingPersons.length || missingRoles.length) {
        logger.error(`No se encontraron personas o roles con los siguientes IDs: 
                            Personas: ${missingPersons}, Roles: ${missingRoles}`);
        return res
          .status(400)
          .json({ msg: "Datos no encontrados para algunas asociaciones." });
      }
    }

    const t = await sequelize.transaction();
    try {
      const homeUpdate = await HomeRepository.update(
        home,
        req.body,
        req.file,
        t
      );

      let associationsData = [];
      // Sincronizar asociaciones
      if (filteredPeople.length > 0) {
        const { toAdd, toUpdate, toDelete } =
          await HomeRepository.syncHomePeople(req.body.id, filteredPeople, t);
        associationsData =
          toAdd.length || toUpdate.length || toDelete.length
            ? { added: toAdd, updated: toUpdate, deleted: toDelete }
            : null;
      }

      await t.commit();
      res.status(200).json({ home: homeUpdate });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar una casa
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina home con ID ${req.body.id}`);

    try {
      const home = await HomeRepository.findById(req.body.id);

      if (!home) {
        return res.status(404).json({ msg: "HomeNotFound" });
      }

      const homeDelete = await HomeRepository.delete(home);

      res.status(200).json({ msg: "HomeDeleted" });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("HomeController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  //Ruta unificada de Mantenedores
  async homeType_status_people(req, res) {
    logger.info(`${req.user.name} - Entra a la ruta unificada de Homes`);

    try {
      const statuses = await StatusService.getStatus("Home");
      const roles = await RoleService.getRoles("Home");
      const hometypes = await HomeController.getHomeTypes();
      const people = await HomeController.getPeople();
      const warehouses = await HomeController.getWarehouses();

      res.json({
        homestatus: statuses,
        homeroles: roles,
        hometypes: hometypes,
        homepeople: people,
        homewarehouses: warehouses,
      });
    } catch (error) {
      logger.error("Error al obtener los mantenedores:", error);
      res.status(500).json({ error: "Error al obtener los mantenedores" });
    }
  },

  async getWarehouses() {
    logger.info("Entra a Buscar Los alamcenes en (homeType_status_people)");
    try {
      const warehouses = await WareHouseRepository.findByStatus(1);

      return warehouses.map((warehouse) => {
        return {
          id: warehouse.id,
          nameWarehouses:
            i18n.__(`warehouse.${warehouse.title}.title`) ===
            `warehouse.${warehouse.title}.title`
              ? i18n.__(`warehouse.${warehouse.title}.title`)
              : warehouse.title,
          descriptionWarehouses:
            i18n.__(`warehouse.${warehouse.title}.title`) ===
            `warehouse.${warehouse.title}.title`
              ? i18n.__(`warehouse.${warehouse.title}.description`)
              : warehouse.description,
          locationWarehouses:
            i18n.__(`warehouse.${warehouse.title}.title`) ===
            `warehouse.${warehouse.title}.title`
              ? i18n.__(`warehouse.${warehouse.title}.location`)
              : warehouse.location,
        };
      });
    } catch (error) {
      logger.error("Error en getWarehouses:", error);
      throw new Error("Error al obtener los almacenes");
    }
  },

  async getHomeTypes() {
    logger.info(
      "Entra a Buscar Los tipos de hogar en (homeType_status_people)"
    );
    try {
      const homeTypes = await HomeTypeRepository.findAll();
      return homeTypes.map((homeType) => {
        return {
          id: homeType.id,
          name:
            i18n.__(`homeType.${homeType.name}.name`) !==
            `homeType.${homeType.name}.name`
              ? i18n.__(`homeType.${homeType.name}.name`)
              : homeType.name,
          description:
            i18n.__(`homeType.${homeType.name}.name`) !==
            `homeType.${homeType.name}.name`
              ? i18n.__(`homeType.${homeType.name}.description`)
              : homeType.description,
          icon: homeType.icon,
        };
      });
    } catch (error) {
      logger.error("Error en getStatus:", error);
      throw new Error("Error al obtener estados");
    }
  },

  async getPeople() {
    logger.info("Entra a Buscar Las personas en (homeType_status_people)");
    try {
      const people = await Person.findAll();

      return people.map((person) => {
        return {
          id: person.id,
          namePerson: person.name,
          imagePerson: person.image,
        };
      });
    } catch (error) {
      logger.error("Error en getPeople:", error);
      throw new Error("Error al obtener personas");
    }
  },
};

module.exports = HomeController;
