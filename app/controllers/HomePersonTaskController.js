const Joi = require("joi");
const {
  HomePersonTask,
  Person,
  Task,
  Role,
  Home,
  sequelize,
} = require("../models");
const logger = require("../../config/logger");
const ActivityLogService = require("../services/ActivityLogService");
const { UserRepository, NotificationRepository } = require("../repositories");

// Esquema de validación para PersonTask
/*const schema = Joi.object({
    person_id: Joi.number().required(),
    task_id: Joi.number().required(),
    role_id: Joi.number().optional(),
    home_id: Joi.number().optional(),
    id: Joi.number().optional(),
});

const assignPeopleSchema = Joi.object({
    task_id: Joi.number().required(),
    people: Joi.array().items(
        Joi.object({
            person_id: Joi.number().required(),
            role_id: Joi.number().required(),
            home_id: Joi.number().required()
        })
    ).required()
});*/

const HomePersonTaskController = {
  // Obtener todas las relaciones Person-Task
  async index(req, res) {
    logger.info(
      `${req.user.name} - Consulta todas las relaciones Home-Person-Task`
    );
    try {
      const personTasks = await HomePersonTask.findAll({
        include: [
          { model: Person, as: "person" },
          { model: Task, as: "task" },
          { model: Home, as: "home" },
          { model: Role, as: "role" },
        ],
      });

      const mappedHomePersonTasks = personTasks.map((homePersonTask) => ({
        id: homePersonTask.id,
        personId: homePersonTask.person.id,
        personName: homePersonTask.person.name,
        homeId: homePersonTask.home.id,
        homeName: homePersonTask.home.name,
        taskId: homePersonTask.task.id,
        taskName: homePersonTask.task.title,
        roleId: homePersonTask.role?.id,
        roleName: homePersonTask.role?.name,
      }));

      res.status(200).json({ homePersonTasks: mappedHomePersonTasks });
    } catch (error) {
      logger.error(`HomeHomePersonTaskController->index: ${error.message}`);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  // Crear una nueva relación Person-Task
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva relación Home-Person-Task`);

    const { person_id, task_id, role_id, home_id, roleName } = req.body;

    // Verificar si la persona existe
    const person = await Person.findByPk(person_id);
    if (!person) {
      logger.error(
        `HomePersonTaskController->store: Persona no encontrada con ID ${person_id}`
      );
      return res.status(400).json({ msg: "PersonNotFound" });
    }

    // Verificar si la tarea existe
    const task = await Task.findByPk(task_id);
    if (!task) {
      logger.error(
        `HomePersonTaskController->store: Tarea no encontrada con ID ${task_id}`
      );
      return res.status(400).json({ msg: "TaskNotFound" });
    }

    // Verificar si el rol existe (si role_id está presente)
    const role = await Role.findByPk(role_id);
    if (!role) {
      logger.error(
        `HomePersonTaskController->store: Rol no encontrado con ID ${role_id}`
      );
      return res.status(400).json({ msg: "RoleNotFound" });
    }

    // Verificar si el hogar existe (si home_id está presente)
    const home = await Home.findByPk(home_id);
    if (!home) {
      logger.error(
        `HomePersonTaskController->store: Hogar no encontrado con ID ${home_id}`
      );
      return res.status(400).json({ msg: "HomeNotFound" });
    }

    let people = [
      {
        person_id,
        role_id,
        roleName,
      },
    ];
    const personIds = [person_id];

    try {
      const homePersonTask = await HomePersonTask.create(req.body);

      const associationsData = [];
      associationsData.push({
        person_id,
        role_id,
        home_id,
        association_id: homePersonTask.id,
      });

      // Registrar la tarea y las asociaciones en el log de actividades
      const activityData = {
        task,
        associations: associationsData,
      };
      await ActivityLogService.createActivityLog(
        "TaskWithAssociations",
        task.id,
        "create",
        req.user.id,
        JSON.stringify(activityData)
      );
      //logica de notificaciones
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
            title: `Fuiste asociado a la tarea ${task.title}`,
            body: `Tu Rol ${user.roleName}`,
          },
          data: {
            route: "/getTask",
            home_id: String(home.id), // Convertir a string
            nameHome: String(home.name),
            role_id: String(user.role_id), // Convertir a string
            roleName: String(user.roleName),
            task_id: String(task_id),
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
                title: `Fuiste asociado a la tarea ${task.title}`,
                description: `Tu Rol ${user.roleName}`,
                data: notification.data, // Usamos el valor procesado
                route: "/getTask",
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
                notification
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
      if (notifications.length){
        // Enviar todas las notificaciones en paralelo
        const firebaseResults =
          await NotificationRepository.sendNotificationMultiCast(
            notifications
          );
      }
      res.status(201).json({ msg: "HomePersonTaskCreated", homePersonTask });
    } catch (error) {
      logger.error(`HomeHomePersonTaskController->store: ${error.message}`);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  // Obtener una relación específica Person-Task por ID
  async show(req, res) {
    logger.info(
      `${req.user.name} - Busca la relación Home-Person-Task con ID: ${req.body.id}`
    );

    try {
      const homePersonTask = await HomePersonTask.findByPk(req.body.id, {
        include: [
          { model: Person, as: "person" },
          { model: Task, as: "task" },
          { model: Role, as: "role" },
          { model: Home, as: "home" },
        ],
      });
      if (!homePersonTask)
        return res.status(404).json({ msg: "HomePersonTaskNotFound" });

      const mappedHomePersonTask = {
        id: homePersonTask.id,
        personId: homePersonTask.person.id,
        personName: homePersonTask.person.name,
        taskId: homePersonTask.task.id,
        taskName: homePersonTask.task.name,
        roleId: homePersonTask.role?.id,
        roleName: homePersonTask.role?.name,
      };

      res.status(200).json({ homePersonTask: mappedHomePersonTask });
    } catch (error) {
      logger.error(`HomePersonTaskController->show: ${error.message}`);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  // Actualizar una relación Person-Task
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza una relación Home-Person-Task`);

    const { person_id, task_id, role_id, home_id } = req.body;
    // Verificar si la persona existe (si person_id está presente)
    if (person_id) {
      const person = await Person.findByPk(person_id);
      if (!person) {
        logger.error(
          `HomePersonTaskController->update: Persona no encontrada con ID ${person_id}`
        );
        return res.status(404).json({ msg: "PersonNotFound" });
      }
    }

    // Verificar si la tarea existe (si task_id está presente)
    if (task_id) {
      const task = await Task.findByPk(task_id);
      if (!task) {
        logger.error(
          `HomePersonTaskController->update: Tarea no encontrada con ID ${task_id}`
        );
        return res.status(404).json({ msg: "TaskNotFound" });
      }
    }

    // Verificar si el rol existe (si role_id está presente)
    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        logger.error(
          `HomePersonTaskController->update: Rol no encontrado con ID ${role_id}`
        );
        return res.status(404).json({ msg: "RoleNotFound" });
      }
    }

    // Verificar si el hogar existe (si home_id está presente)
    if (home_id) {
      const home = await Home.findByPk(home_id);
      if (!home) {
        logger.error(
          `HomePersonTaskController->update: Hogar no encontrado con ID ${home_id}`
        );
        return res.status(404).json({ msg: "HomeNotFound" });
      }
    }

    try {
      const homePersonTask = await HomePersonTask.findByPk(req.body.id);
      if (!homePersonTask)
        return res.status(404).json({ msg: "HomePersonTaskNotFound" });

      // Definir los campos que se pueden actualizar
      const fieldsToUpdate = ["person_id", "task_id", "role_id", "home_id"];

      // Filtrar los campos que están presentes en req.body y que son válidos
      const updatedData = Object.keys(req.body)
        .filter(
          (key) => fieldsToUpdate.includes(key) && req.body[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      // Si hay datos para actualizar, realizamos la actualización
      if (Object.keys(updatedData).length > 0) {
        await homePersonTask.update(updatedData);
        logger.info(
          `HomePersonTask actualizado exitosamente: ${homePersonTask.id}`
        );
      }
      res.status(200).json({ msg: "HomePersonTaskUpdated", homePersonTask });
    } catch (error) {
      logger.error(`HomePersonTaskController->update: ${error.message}`);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  // Eliminar una relación Person-Task
  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina una relación Home-Person-Task`);

    try {
      const homepersonTask = await HomePersonTask.findByPk(req.body.id);
      if (!homepersonTask)
        return res.status(404).json({ msg: "PersonTaskNotFound" });

      await homepersonTask.destroy();
      res.status(200).json({ msg: "HomePersonTaskDeleted" });
    } catch (error) {
      logger.error(`HomePersonTaskController->destroy: ${error.message}`);
      res.status(500).json({ error: "ServerError", details: error.message });
    }
  },

  async assignPeopleToTask(req, res) {
    logger.info(`${req.user.name} - Crea una nueva relación Home-People-Task`);

    const { task_id, people } = req.body; // Extraer valores validados

    // Iniciar transacción
    const t = await sequelize.transaction();

    try {
      // Buscar la tarea
      const task = await Task.findByPk(task_id);
      if (!task) {
        logger.error(
          `assignPeopleToTask: No se encontró una tarea con ID ${task_id}`
        );
        return res.status(404).json({ error: "TaskNotFound" });
      }

      // Obtener todos los IDs de las personas, roles y hogares para consultas paralelas
      const personIds = people.map((person) => person.person_id);
      const roleIds = people.map((person) => person.role_id);
      const homeIds = people.map((person) => person.home_id);

      // Consultas paralelas para verificar la existencia de las personas, roles y hogares
      const [persons, roles, homes] = await Promise.all([
        Person.findAll({ where: { id: personIds } }),
        Role.findAll({ where: { id: roleIds } }),
        Home.findAll({ where: { id: homeIds } }),
      ]);

      // Mapear los resultados a un objeto para validación rápida
      const personMap = new Map(persons.map((person) => [person.id, person]));
      const roleMap = new Map(roles.map((role) => [role.id, role]));
      const homeMap = new Map(homes.map((home) => [home.id, home]));

      // Acumular los errores
      const errors = [];
      const associations = [];
      const associationsData = []; // Para el log de actividades

      // Validar y preparar las asociaciones
      for (const person of people) {
        const { person_id, role_id, home_id } = person;

        // Verificar existencia de la persona, rol y hogar
        const personInstance = personMap.get(person_id);
        const roleInstance = roleMap.get(role_id);
        const homeInstance = homeMap.get(home_id);

        if (!personInstance || !roleInstance || !homeInstance) {
          errors.push(
            `Falta asociación para persona ${person_id}, rol ${role_id}, o hogar ${home_id}`
          );
          continue;
        }

        // Crear la asociación en la base de datos (se agregan a un array para bulkCreate)
        associations.push({
          task_id: task.id,
          person_id,
          role_id,
          home_id,
        });

        // Acumular la información de la asociación para el log de actividades
        associationsData.push({
          person_id,
          role_id,
          home_id,
        });
      }

      // Si hubo errores, hacer rollback y devolver respuesta
      if (errors.length) {
        logger.error(`assignPeopleToTask - Errores: ${errors.join(", ")}`);
        await t.rollback();
        return res.status(400).json({ msg: errors });
      }

      // Realizar bulkCreate solo si no hubo errores
      await HomePersonTask.bulkCreate(associations, {
        updateOnDuplicate: ["role_id", "home_id"], // Actualizar si ya existe (no es necesario 'updatedAt' aquí)
        transaction: t,
      });

      // Registrar la tarea y las asociaciones en el log de actividades
      const activityData = {
        task,
        associations: associationsData,
      };

      await ActivityLogService.createActivityLog(
        "TaskWithAssociations",
        task.id,
        "create",
        req.user.id,
        JSON.stringify(activityData),
        { transaction: t } // Aquí pasas la transacción
      );

      // Confirmar transacción
      await t.commit();
      res.status(200).json({ msg: "PeopleAssignedToTask" });
    } catch (error) {
      // Si algo falla, hacer rollback y loguear el error
      await t.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("assignPeopleToTask: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = HomePersonTaskController;
