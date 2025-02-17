const { Op, fn, col, literal } = require("sequelize");
const path = require("path");
const fs = require("fs");
const {
  Task,
  Priority,
  Status,
  Category,
  Person,
  HomePersonTask,
  Role,
  Home,
  HomePerson,
  sequelize,
} = require("../models"); // Importar el modelo Home
const i18n = require("../../config/i18n-config");
const ImageService = require("../services/ImageService");
const logger = require("../../config/logger"); // Importa el logger
const UserRepository = require("./UserRepository");
const NotificationRepository = require("./NotificationRepository");

const TaskRepository = {
  async findAll() {
    return await Task.findAll({
      where: { parent_id: null },
      include: [
        { model: Priority, as: "priority" },
        { model: Status, as: "status" },
        { model: Category, as: "category" },
        {
          model: Task,
          as: "children",
          include: [
            { model: Priority, as: "priority" },
            { model: Status, as: "status" },
            { model: Category, as: "category" },
            {
              model: HomePersonTask,
              as: "homePersonTasks",
              include: [
                {
                  model: Role,
                  as: "role", // Debe coincidir con la definición en el modelo
                },
                {
                  model: Person,
                  as: "person", // Incluir persona si también es necesario
                },
                {
                  model: Home,
                  as: "home", // Incluir persona si también es necesario
                },
              ],
            },
          ],
        },
        {
          model: HomePersonTask,
          as: "homePersonTasks",
          include: [
            {
              model: Role,
              as: "role", // Debe coincidir con la definición en el modelo
            },
            {
              model: Person,
              as: "person", // Incluir persona si también es necesario
            },
            {
              model: Home,
              as: "home", // Incluir persona si también es necesario
            },
          ],
        },
      ],
    });
  },

  async mapChildren(children, personId) {
    try {
      return await Promise.all(
        children.map(async (child) => {
          return {
            id: child.id,
            title: child.title,
            description: child.description,
            startDate: child.start_date,
            start_date: child.start_date,
            endDate: child.end_date,
            end_date: child.end_date,
            startTime: child.start_time,
            start_time: child.start_time,
            endTime: child.end_time,
            end_time: child.end_time,
            type: child.type,
            priorityId: child.priority_id,
            priority_id: child.priority_id,
            colorPriority: child.priority?.color,
            statusId: child.status_id,
            status_id: child.status_id,
            categoryId: child.category_id,
            category_id: child.category_id,
            nameCategory: child.category?.name,
            iconCategory: child.category?.icon,
            recurrence: child.recurrence,
            estimatedTime: child.estimated_time,
            estimated_time: child.estimated_time,
            comments: child.comments,
            attachments: child.attachments,
            geoLocation: child.geo_location,
            geo_location: child.geo_location,
            parentId: child.parent_id,
            parent_id: child.parent_id,
            home_id: child.home_id,
            // Personas relacionadas con la tarea hija
            people: (await this.peopleTask(child, personId)) || [],
            // Llama recursivamente a mapChildren para obtener hijos de este hijo
            children: child.children
              ? await this.mapChildren(child.children, personId)
              : [],
          };
        })
      );
    } catch (error) {
      logger.error("TaskRepository->mapChildren", error.message);
      throw error; // Manejo del error para debug
    }
  },

  async findById(id) {
    return await Task.findByPk(id, {
      include: [
        {
          association: "children",
          include: [
            { association: "priority" },
            { association: "status" },
            { association: "category" },
            {
              model: HomePersonTask,
              as: "homePersonTasks",
            },
          ],
        },
        { association: "priority" },
        { association: "status" },
        { association: "category" },
        {
          model: HomePersonTask,
          as: "homePersonTasks",
        },
      ],
    });
  },

  async findAllDate(start_date, personId, homeId) {
    return await Task.findAll({
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn("DATE", sequelize.col("Task.start_date")),
            start_date // Comparar solo la parte de la fecha
          ),
          {
            [Op.or]: [
              { person_id: personId }, // Relación directa con la persona
              sequelize.literal(`EXISTS (
                            SELECT 1
                            FROM home_person_task
                            WHERE home_person_task.task_id = Task.id
                            AND home_person_task.person_id = ${personId}
                        )`),
            ],
          },
          { home_id: homeId }, // Filtrar por el hogar dado
        ],
      },
      include: [
        {
          model: HomePersonTask,
          as: "homePersonTasks",
          required: false, // Permite tareas sin relación en home_person_task
        },
        {
          model: Task,
          as: "children", // Relación para tareas hijas
          include: [
            {
              model: HomePersonTask,
              as: "homePersonTasks",
              required: false, // Permite tareas hijas sin relación en home_person_task
              where: {
                person_id: personId, // Filtrar por la persona en las tareas hijas
              },
            },
            { model: Priority, as: "priority" },
            { model: Status, as: "status" },
            { model: Category, as: "category" },
            {
              model: Person, // Incluir la persona relacionada
              as: "person",
              required: false, // Puede no tener relación
            },
            {
              model: Home, // Incluir el hogar relacionado
              as: "home",
              required: false, // Puede no tener relación
            },
          ],
          required: false, // Incluir aunque no haya hijos
        },
        { model: Priority, as: "priority" },
        { model: Status, as: "status" },
        { model: Category, as: "category" },
        {
          model: Person, // Incluir la persona relacionada
          as: "person",
          required: false, // Puede no tener relación
        },
        {
          model: Home, // Incluir el hogar relacionado
          as: "home",
          required: false, // Puede no tener relación
        },
      ],
    });
  },

  async findAllDateWeb(start_date, personId, homeId) {
    return await Task.findAll({
      where: {
        [Op.and]: [
          { home_id: homeId }, // Filtra por home_id
          {
            [Op.or]: [
              { person_id: personId }, // Filtra por person_id en la tabla Task
              { '$homePersonTasks.person_id$': personId }, // Filtra por person_id en la tabla HomePersonTask
            ],
          },
        ],
      },
      include: [
        {
          model: HomePersonTask,
          as: "homePersonTasks",
          required: false, // Permite tareas sin relación en home_person_task
        },
        {
          model: Task,
          as: "children", // Relación para tareas hijas
          include: [
            {
              model: HomePersonTask,
              as: "homePersonTasks",
              required: false, // Permite tareas hijas sin relación en home_person_task
              where: {
                person_id: personId, // Filtrar por la persona en las tareas hijas
              },
            },
            { model: Priority, as: "priority" },
            { model: Status, as: "status" },
            { model: Category, as: "category" },
            {
              model: Person, // Incluir la persona relacionada
              as: "person",
              required: false, // Puede no tener relación
            },
            {
              model: Home, // Incluir el hogar relacionado
              as: "home",
              required: false, // Puede no tener relación
            },
          ],
          required: false, // Incluir aunque no haya hijos
        },
        { model: Priority, as: "priority" },
        { model: Status, as: "status" },
        { model: Category, as: "category" },
        {
          model: Person, // Incluir la persona relacionada
          as: "person",
          required: false, // Puede no tener relación
        },
        {
          model: Home, // Incluir el hogar relacionado
          as: "home",
          required: false, // Puede no tener relación
        },
      ],
    });
  },

  async getTaskPeople(taskId) {
    try {
      // Realizar la consulta a la base de datos
      const homePersonTask = await HomePersonTask.findAll({
        where: { task_id: taskId },
        include: [
          {
            model: Role,
            attributes: ["name"], // Suponiendo que el nombre del rol está en la columna 'name'
            as: "role", // Alias de la relación
          },
        ],
      });

      // Formatear la respuesta
      const formattedResponse = homePersonTask.map((person) => ({
        person_id: person.person_id,
        role_id: person.role_id,
        roleName: person.role ? person.role.name : null, // Obtener el nombre del rol
      }));
      // Crear un array solo con los person_id
      const personIds = homePersonTask.map((person) => person.person_id);

      // Devolver ambos resultados
      return {
        people: formattedResponse, // [[person_id: 5, role_id: 4, roleName: "prueba"], ...]
        personIds: personIds, // [5, 6, ...]
      };
    } catch (error) {
      logger.error("Error al obtener los registros de home_person:", error);
      throw error;
    }
  },

  async peopleTask(task, personId) {
    const homePersonTasks = await HomePersonTask.findAll({
      where: { task_id: task.id },
      include: [
        {
          model: Role,
          as: "role",
        },
        {
          model: Person,
          as: "person",
        },
      ],
    });

    // Devolver las personas mapeadas
    let people = homePersonTasks.map((homePersonTask) => ({
      id: homePersonTask.person_id,
      homePersonTaskId: homePersonTask.id,
      name: homePersonTask.person.name,
      image: homePersonTask.person.image,
      roleId: homePersonTask.role_id,
      roleName: homePersonTask.role.name,
      roleName:
        i18n.__(`roles.${homePersonTask.role.name}.name`) !==
        `roles.${homePersonTask.role.name}.name`
          ? i18n.__(`roles.${homePersonTask.role.name}.name`) // Traducción del rol si está disponible
          : homePersonTask.role.name,
    }));
    // Verificar si la persona que hace la consulta tiene relación directa con la tarea
    const personAlreadyIncluded = people.some(
      (person) => person.id === personId
    );
    // Si la persona no está relacionada, se agrega solo como "Creador"
    if (!personAlreadyIncluded && task.person_id === personId) {
      const person = await Person.findByPk(personId); // Obtener los detalles de la persona
      if (person) {
        people.push({
          id: task.person_id,
          name: person.name,
          image: person.image,
          roleId: 0,
          homePersonTaskId: 0,
          roleName:
            i18n.__(`roles.${"Creador"}.name`) !== `roles.${"Creador"}.name`
              ? i18n.__(`roles.${"Creador"}.name`) // Traducción del rol si está disponible
              : "Creador",
        });
      }
    }

    return people;
  },

  async create(body, file, personId, t) {
    try {
      // Crear la tarea
      const task = await Task.create(
        {
          title: body.title,
          description: body.description,
          start_date: body.start_date,
          end_date: body.end_date,
          start_time: body.start_time,
          end_time: body.end_time,
          type: body.type,
          priority_id: body.priority_id,
          status_id: body.status_id,
          category_id: body.category_id,
          home_id: body.home_id,
          person_id: personId,
          recurrence: body.recurrence,
          estimated_time: body.estimated_time,
          comments: body.comments,
          attachments: "tasks/default.jpg",
          geo_location: body.geo_location,
          parent_id: body.parent_id,
        },
        { transaction: t }
      );

      // Si se ha subido un archivo, procesarlo y actualizar la tarea
      if (file) {
        const newFilename = ImageService.generateFilename(
          "tasks",
          task.id,
          file.originalname
        );
        task.attachments = await ImageService.moveFile(file, newFilename);
        await task.update(
          { attachments: task.attachments },
          { transaction: t }
        );
      }
      return task;
    } catch (err) {
      logger.error(`Error en TaskRepository->store: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  },

  async update(task, body, file, t) {
    // Lista de campos permitidos para actualizar
    const fieldsToUpdate = [
      "title",
      "description",
      "priority_id",
      "status_id",
      "category_id",
      "start_date",
      "end_date",
      "recurrence",
      "estimated_time",
      "comments",
      "geo_location",
      "parent_id",
      "start_time",
      "end_time",
      "type",
    ];
    try {
      // Filtrar campos en req.body y construir el objeto updatedData
      const updatedData = Object.keys(body)
        .filter(
          (key) => fieldsToUpdate.includes(key) && body[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = body[key];
          return obj;
        }, {});

      // Procesar la imagen si se sube una nueva
      if (file) {
        if (task.attachments && task.attachments !== "tasks/default.jpg") {
          await ImageService.deleteFile(task.attachments);
        }
        const newFilename = ImageService.generateFilename(
          "tasks",
          task.id,
          file.originalname
        );
        updatedData.attachments = await ImageService.moveFile(
          file,
          newFilename
        );
      }

      // Actualizar la tarea solo si hay datos para cambiar
      if (Object.keys(updatedData).length > 0) {
        await task.update(updatedData, { transaction: t });
        logger.info(`Task actualizada exitosamente (ID: ${task.id})`);
      }

      return updatedData;
    } catch (err) {
      logger.error(`Error en TaskRepository->update: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  },

  async delete(task, t) {
    if (task.attachments && task.attachments !== "tasks/default.jpg") {
      await ImageService.deleteFile(task.attachments);
    }

    return await task.destroy({ transaction: t });
  },

  async syncTaskPeople(taskId, peopleArray, t, task = []) {
    // Obtener las asociaciones actuales para la tarea especificada
    const currentAssociations = await HomePersonTask.findAll({
      where: { task_id: taskId },
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
    const notifications = [];

    // Obtener tokens de los usuarios involucrados
    const personIds = peopleArray.map((p) => p.person_id);
    const { tokens, userTokens } =
      await UserRepository.getUserNotificationTokensByPersons(
        personIds,
        peopleArray
      );
    // Recorremos las nuevas asociaciones para determinar si agregar o actualizar
    Object.keys(newMap).forEach((key) => {
      const incoming = newMap[key];

      // Verificar si ya existe una relación para esta combinación
      const current = currentMap[key];

      if (!current) {
        // Si la asociación no existe en la base de datos, agregarla
        toAdd.push({
          task_id: taskId,
          ...incoming,
        });
        // Notificación de agregado
        const userAdd = userTokens.find(
          (u) => u.person_id === parseInt(incoming.person_id)
        );

        if (userAdd) {
          notifications.push({
            token: [userAdd.firebaseId],
            notification: {
              title: `Fuiste asociado con la tarea ${task.title}`,
              body: `Tu rol: ${userAdd.roleName}`,
            },
            data: {
              route: "/getTask",
              home_id: String(task.home_id),
              role_id: String(userAdd.role_id),
              roleName: String(userAdd.roleName),
              task_id: String(taskId),
            },
          });
        }
      } else {
        // Si la asociación existe pero el rol ha cambiado, la actualizamos
        if (current.role_id !== incoming.role_id) {
          toUpdate.push({
            id: current.id, // Usamos el id de la relación actual
            role_id: incoming.role_id,
          });
          // Notificación de actualizado
          const user = userTokens.find(
            (u) => u.person_id === parseInt(incoming.person_id)
          );

          if (user) {
            notifications.push({
              token: [user.firebaseId],
              notification: {
                title: `Tu Rol en la tarea ${task.title} fue actualizado`,
                body: `Nuevo rol: ${user.roleName}`,
              },
              data: {
                route: "/getTask",
                home_id: String(task.home_id),
                role_id: String(user.role_id),
                roleName: String(user.roleName),
                task_id: String(taskId),
              },
            });
          }
        }
      }
    });

    // Recorremos las asociaciones actuales para eliminar las que ya no existen en el nuevo conjunto
    currentAssociations.forEach((current) => {
      const key = `${current.person_id}-${current.home_id}`;
      if (!newMap[key]) {
        toDelete.push(current.id);
        // Notificación de eliminación
        const user = userTokens.find(
          (u) => u.person_id === parseInt(current.person_id)
        );
        if (user) {
          notifications.push({
            token: [user.firebaseId],
            notification: {
              title: `Fuiste desasociado de la tarea ${task.title}`,
              body: `Ya no estas relacionado con esta tarea.`,
            },
            data: {
              route: "/getTask",
              home_id: String(task.home_id),
              role_id: String(user.role_id),
              roleName: String(user.roleName),
              task_id: String(taskId),
            },
          });
        }
      }
    });

    // Aplicar las operaciones: eliminar, actualizar, agregar
    if (toDelete.length > 0) {
      await HomePersonTask.destroy({
        where: { id: toDelete },
        transaction: t,
      });
      actions.push({ action: "deleted", ids: toDelete });
    }

    if (toUpdate.length > 0) {
      for (const update of toUpdate) {
        await HomePersonTask.update(
          { role_id: update.role_id },
          { where: { id: update.id }, transaction: t }
        );
      }
      actions.push({ action: "updated", ids: toUpdate.map((u) => u.id) });
    }

    if (toAdd.length > 0) {
      await HomePersonTask.bulkCreate(toAdd, { transaction: t });
      actions.push({ action: "added", ids: toAdd.map((a) => a.id) });
    }
    if (notifications.length) {
      const notificationsToCreate = userTokens
        .map((user) => {
          const notification = notifications.find(
            (n) => n.token[0] === user.firebaseId
          );
          if (notification) {
            return {
              home_id: task.home_id,
              user_id: user.user_id,
              title: notification.notification.title,
              description: notification.notification.body,
              data: notification.data, // Usamos el valor procesado
              route: "/getTask",
              firebaseId: notification.token[0],
            };
          }
          return null; // Retornar null si no se encuentra la notificación
        })
        .filter((notification) => notification !== null); // Filtrar los elementos null

      const results = await Promise.allSettled(
        notificationsToCreate.map(async (notification) => {
          try {
            const result = await NotificationRepository.create(notification, t);
          } catch (error) {
            logger.error(
              `Error al crear notificación para user_id ${notification.user_id}:`,
              error
            );
          }
        })
      );

      const firebaseResults =
        await NotificationRepository.sendNotificationMultiCast(notifications);
    }
    // Devolver detalles de las operaciones realizadas
    return { toAdd, toUpdate, toDelete, actions };
  },

  async updatePointsAndTasks(homeId, updatesArray, t = null) {
    try {
      // Recorrer el array y actualizar cada registro
      for (const update of updatesArray) {
        const { id, person_id, points, description } = update;

        // 1. Actualizar la tabla home-person-task
        const homePersonTask = await HomePersonTask.findByPk(id, {
          transaction: t,
        });

        if (homePersonTask) {
          // Actualizar description en home-person-task
          homePersonTask.description = description;
          homePersonTask.points = points;
          await homePersonTask.save({ transaction: t });
        }
        // 2. Incrementar points en la tabla home_person
        const homePerson = await HomePerson.findOne({
          where: {
            home_id: homeId,
            person_id: person_id,
          },
          transaction: t,
        });

        if (homePerson) {
          homePerson.points += points;
          await homePerson.save({ transaction: t });
        }
      }

      logger.info("Puntos y tareas actualizados exitosamente.");
    } catch (error) {
      logger.error(`Error al actualizar puntos y tareas: ${error.message}`);
      throw error;
    }
  },
};

module.exports = TaskRepository;
