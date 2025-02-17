const { HomePerson, Home, Person, Role, sequelize } = require("../models");
const logger = require("../../config/logger");
const {
  UserRepository,
  HomeRepository,
  PersonRepository,
  NotificationRepository,
  HomePersonRepository,
} = require("../repositories");

const HomePersonController = {
  // Obtener todas las relaciones Home-Person
  async index(req, res) {
    logger.info(`${req.user.name} - Busca todas las relaciones Home-Person`);
    try {
      const homePeople = await HomePerson.findAll({
        include: [
          { model: Home, as: "home" },
          { model: Person, as: "person" },
          { model: Role, as: "role" },
        ],
      });

      // Mapeamos los resultados para obtener solo los IDs y nombres
      const mappedhomePeople = homePeople.map((homePerson) => ({
        id: homePerson.id,
        homeId: homePerson.home.id, // ID del hogar
        homeName: homePerson.home.name, // Nombre del hogar
        personId: homePerson.person.id, // ID de la persona
        personName: homePerson.person.name, // Nombre de la persona
        roleId: homePerson.role.id, // ID del rol
        roleName: homePerson.role.name, // Nombre del rol
      }));

      res.status(200).json({ homePeople: mappedhomePeople });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("HomePersonController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async index_home(req, res) {
    const { home_id } = req.body; // Obtener home_id desde la query string
    logger.info(
      `${req.user.name} - Busca todas las relaciones Home-Person para el hogar ${home_id}`
    );

    const home = await HomeRepository.findById(home_id);
    if (!home) {
      logger.error(
        `HomePersonController->index_home: Hogar no encontrado con ID ${home_id}`
      );
      return res.status(204).json({ msg: "HomeNotFound" });
    }

    try {
      // Obtener las personas asociadas al hogar desde el repositorio
      const homePeople = await HomePersonRepository.getPeopleByHomeId(home_id);

      // Devolver la respuesta
      res.status(200).json({ homePeople });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("HomePersonController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Crear una nueva relación Home-Person
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva relación Home-Person`);
    logger.info("datos recibidos al asociar un apersona a un hogar");
    logger.info(JSON.stringify(req.body));

    const { home_id, person_id, role_id, roleName } = req.body;

    const home = await HomeRepository.findById(home_id);
    if (!home) {
      logger.error(
        `HomePersonController->store: Hogar no encontrado con ID ${home_id}`
      );
      return res.status(204).json({ msg: "HomeNotFound" });
    }

    const person = await PersonRepository.findById(person_id);

    if (!person) {
      logger.error(
        `HomePersonController->store: Persona con no encontrada con ID ${person_id}`
      );
      return res.status(404).json({ msg: "PersonNotFound" });
    }

    let people = [
      {
        person_id,
        role_id,
        roleName,
      },
    ];
    const personIds = [person_id];
    const t = await sequelize.transaction();
    try {
      const homePerson = await HomePerson.create(
        {
          home_id: home_id,
          person_id: person_id,
          role_id: role_id,
        },
        { transaction: t }
      );
      const { tokens, userTokens } =
        await UserRepository.getUserNotificationTokensByPersons(
          personIds,
          people
        );
      let notifications = {};
      //logica de notificaciones
      if (tokens.length) {
        // Iterar sobre cada usuario y enviar notificación personalizada
        notifications = userTokens.map((user) => ({
          token: [user.firebaseId],
          notification: {
            title: `Fuiste asociado al hogar ${home.name}`,
            body: `Asignado como ${user.roleName}`,
          },
          data: {
            route: "/getHome",
            home_id: String(home.id), // Convertir a string
            nameHome: String(home.name),
            role_id: String(user.role_id), // Convertir a string
            roleName: String(user.roleName),
          },
        }));

        const notificationsToCreate = userTokens
          .map((user) => {
            const notification = notifications.find(
              (n) => n.token[0] === user.firebaseId
            );
            if (notification) {
              return {
                home_id: home.id,
                user_id: user.user_id,
                title: `Fuiste asociado al hogar ${home.name}`,
                description: `Asignado como ${user.roleName}`,
                data: notification.data, // Usamos el valor procesado
                route: "/getHome",
                firebaseId: user.firebaseId,
              };
            }
            return null; // Retornar null si no se encuentra la notificación
          })
          .filter((notification) => notification !== null); // Filtrar los elementos null

        const results = await Promise.allSettled(
          notificationsToCreate.map(async (notification) => {
            try {
              const result = await NotificationRepository.create(
                notification,
                t
              );
            } catch (error) {
              logger.error(
                `Error al crear notificación para user_id ${notification.user_id}:`,
                error
              );
            }
          })
        );
      }
      await t.commit();
      if (notifications.length) {
        // Enviar todas las notificaciones en paralelo
        const firebaseResults =
          await NotificationRepository.sendNotificationMultiCast(notifications);
      }
      res.status(201).json({ msg: "HomePersonCreated" });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("HomePersonController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async addPoints(req, res) {
    const { home_id, person_id, points } = req.body;
    const { updatesArray } = req.body;
    // Extraer todos los home_id y person_id del array de actualizaciones
    const homeIds = updatesArray.map((update) => update.home_id);
    const personIds = updatesArray.map((update) => update.person_id);

    // Verificar que todos los home_id y person_id existan
    const [homes, persons] = await Promise.all([
      HomeRepository.findById(homeIds),
      PersonRepository.findById(personIds),
    ]);

    // Comprobar si faltan homes o persons
    const missingHomes = homeIds.filter(
      (id) => !homes.find((h) => h.id === id)
    );
    const missingPersons = personIds.filter(
      (id) => !persons.find((p) => p.id === id)
    );

    // Si faltan homes o persons, devolver un error
    if (missingHomes.length > 0 || missingPersons.length > 0) {
      logger.error(`No se encontraron los siguientes IDs: 
                    Hogares: ${missingHomes}, Personas: ${missingPersons}`);
      return res.status(400).json({
        message: "Datos no encontrados para algunas asociaciones.",
        missingHomes,
        missingPersons,
      });
    }
    try {
      const updatedHomePerson =
        await HomePersonRepository.addPointsToPersonInHome(
          home_id,
          person_id,
          points
        );
      res.status(200).json({
        message: "Puntos sumados correctamente",
        data: updatedHomePerson,
      });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("HomePersonController->addPoints: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener una relación específica Home-Person por ID
  async show(req, res) {
    logger.info(
      `${req.user.name} - Busca la relación Home-Person con ID: ${req.body.id}`
    );

    try {
      const homePerson = await HomePerson.findByPk(req.body.id, {
        include: [
          { model: Home, as: "home" },
          { model: Person, as: "person" },
          { model: Role, as: "role" },
        ],
      });
      if (!homePerson) {
        return res.status(404).json({ msg: "HomePersonNotFound" });
      }

      // Mapeamos los resultados para obtener solo los IDs y nombres
      const mappedhomePeople = {
        id: homePerson.id,
        homeId: homePerson.home.id, // ID del hogar
        homeName: homePerson.home.name, // Nombre del hogar
        personId: homePerson.person.id, // ID de la persona
        personName: homePerson.person.name, // Nombre de la persona
        roleId: homePerson.role.id, // ID del rol
        roleName: homePerson.role.name, // Nombre del rol
      };
      res.status(200).json({ homePeople: [mappedhomePeople] });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("HomePersonController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar una relación Home-Person
  async update(req, res) {
    logger.info(`${req.user.name} - Editando una relación Home-Person`);

    try {
      const homePerson = await HomePerson.findByPk(req.body.id);
      if (!homePerson) {
        logger.error(
          `HomePersonController->update: Relación no encontrada con ID ${req.body.id}`
        );
        return res.status(404).json({ msg: "HomePersonNotFound" });
      }
      const homePersoUpdate = await HomePersonRepository.update(
        homePerson,
        req.body
      );
      res.status(200).json({ msg: "HomePersonUpdated", homePersoUpdate });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("HomePersonController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar una relación Home-Person
  async destroy(req, res) {
    logger.info(`${req.user.name} - Eliminando una relación Home-Person`);

    try {
      const homePerson = await HomePerson.findByPk(req.body.id);
      if (!homePerson) {
        logger.error(
          `HomePersonController->destroy: Relación no encontrada con ID ${req.params.id}`
        );
        return res.status(404).json({ msg: "HomePersonNotFound" });
      }

      await homePerson.destroy();
      res.status(200).json({ msg: "HomePersonDeleted" });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("HomePersonController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async assignPeopleToHome(req, res) {
    logger.info(
      `${req.user.name} - entra a asociar varias personas a un hogar`
    );

    const { home_id, people } = req.body; // Extraer valores validados

    try {
      const home = await Home.findByPk(home_id);
      if (!home) {
        logger.error(
          `assignPeopleToHome: No se encontró un hogar con ID ${home_id}`
        );
        return res.status(404).json({ error: "HomeNotFound" });
      }

      // Crear o actualizar las relaciones en la tabla pivote
      const associations = people.map(async (person) => {
        const { person_id, role_id } = person;

        // Verificar si la persona existe
        const personInstance = await Person.findByPk(person_id);
        if (!personInstance) {
          logger.error(
            `assignPeopleToHome: No se encontró una persona con ID ${person_id}`
          );
          return res
            .status(404)
            .json({ error: `PersonNotFound: ID ${person_id}` });
        }

        // Verificar si la persona existe
        const roleInstance = await Role.findByPk(role_id);
        if (!roleInstance) {
          logger.error(
            `assignPeopleToHome: No se encontró un rol con ID ${role_id}`
          );
          return res
            .status(404)
            .json({ error: `PersonNotFound: ID ${role_id}` });
        }

        // Crear o actualizar la asociación en la tabla pivote
        await HomePerson.upsert({
          home_id: home_id,
          person_id: person_id,
          role_id: role_id,
        });
      });

      // Esperar a que todas las asociaciones se completen
      await Promise.all(associations);

      res.status(200).json({ msg: "PeopleAssignedToHome" });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("HomePersonController->assignPeopleToHome: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async updatePointsById(req, res) {
    const { updatesArray } = req.body;

    // Extraer todos los id del array de actualizaciones
    const homePersonIds = updatesArray.map((update) => update.id);

    // Verificar que todos los id existan en la tabla home_person
    const homePersons = await HomePersonRepository.findByIds(homePersonIds);

    // Comprobar si faltan registros
    const missingIds = homePersonIds.filter(
      (id) => !homePersons.find((hp) => hp.id === id)
    );

    // Si faltan registros, devolver un error
    if (missingIds.length > 0) {
      logger.error(
        `No se encontraron los siguientes IDs en home_person: ${missingIds}`
      );
      return res.status(400).json({
        message: "Datos no encontrados para algunas asociaciones.",
        missingIds,
      });
    }

    try {
      await HomePersonRepository.updatePointsById(updatesArray);
      res
        .status(200)
        .json({ message: "Puntos actualizados exitosamente por id." });
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error al actualizar puntos por id",
          error: error.message,
        });
    }
  },

  async updatePointsByHomeAndPerson(req, res) {
    const { updatesArray } = req.body;

    try {
      // Extraer todos los home_id y person_id del array de actualizaciones
      const homeIds = updatesArray.map((update) => update.home_id);
      const personIds = updatesArray.map((update) => update.person_id);

      // Verificar que todos los home_id y person_id existan
      const [homes, persons] = await Promise.all([
        HomeRepository.findByIds(homeIds),
        PersonRepository.findByIds(personIds),
      ]);

      // Comprobar si faltan homes o persons
      const missingHomes = homeIds.filter(
        (id) => !homes.find((h) => h.id === id)
      );
      const missingPersons = personIds.filter(
        (id) => !persons.find((p) => p.id === id)
      );

      // Si faltan homes o persons, devolver un error
      if (missingHomes.length > 0 || missingPersons.length > 0) {
        logger.error(`No se encontraron los siguientes IDs: 
                      Hogares: ${missingHomes}, Personas: ${missingPersons}`);
        return res.status(400).json({
          message: "Datos no encontrados para algunas asociaciones.",
          missingHomes,
          missingPersons,
        });
      }

      // Si todas las validaciones pasan, proceder con la actualización
      await HomePersonRepository.updatePointsByHomeAndPerson(updatesArray);

      res.status(200).json({
        message: "Puntos actualizados exitosamente por home_id y person_id.",
      });
    } catch (error) {
      logger.error(
        `Error al actualizar puntos por home_id y person_id: ${error.message}`
      );
      res.status(500).json({
        message: "Error al actualizar puntos por home_id y person_id",
        error: error.message,
      });
    }
  },
};

module.exports = HomePersonController;
