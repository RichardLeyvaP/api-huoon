const Joi = require("joi");
const { Op } = require("sequelize");
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
const logger = require("../../config/logger"); // Importa el logger
const {
  CategoryService,
  StatusService,
  ActivityLogService,
  RoleService,
} = require("../services");
const i18n = require("../../config/i18n-config");
const {
  TaskRepository,
  HomeRepository,
  PriorityRepository,
  UserRepository,
  NotificationRepository,
  PersonRepository,
  StatusRepository,
  RoleRepository,
  HomePersonRepository,
} = require("../repositories");
const IntentDetectionService = require("../services/IntentDetectionService");
const TaskSuggestionService = require("../services/TaskSuggestionService");
const openai = require("../../config/openaiClient");

const TaskController = {
  // Obtener todas las tareas
  async index(req, res) {
    logger.info(`${req.user.name} - Entra a buscar las tareas`); // Registro de la acción
    try {
      // Obtener solo las tareas principales (sin padre) directamente en la consulta
      const tasks = await TaskRepository.findAll();

      if (!tasks.length) {
        return res.status(204).json({ msg: "TaskNotFound", tasks: tasks });
      }

      // Mapear las tareas
      const mappedTasks = await Promise.all(
        tasks.map(async (task) => {
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            startDate: task.start_date,
            endDate: task.end_date,
            startTime: task.start_time,
            endTime: task.end_time,
            type: task.type,
            priorityId: task.priority_id,
            colorPriority: task.priority?.color,
            statusId: task.status_id,
            categoryId: task.category_id,
            nameCategory: task.category?.name,
            iconCategory: task.category?.icon,
            recurrence: task.recurrence,
            estimatedTime: task.estimated_time,
            comments: task.comments,
            attachments: task.attachments,
            geoLocation: task.geo_location,
            parentId: task.parent_id,
            people: await TaskRepository.peopleTask(task, req.person.id),
            children: await TaskRepository.mapChildren(
              task.children,
              req.person.id
            ), // Espera el mapeo de hijos
          };
        })
      );

      return res.status(200).json({ tasks: mappedTasks }); // Tareas encontradas
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("TaskController->index: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getTaskDate(req, res) {
    logger.info(
      `${req.user.name} - Entra a buscar las tareas de una fecha dada`
    ); // Registro de la acción

    try {
      if (
        req.body.home_id === undefined &&
        req.body.home_id === 0 &&
        req.body.home_id === null
      ) {
        logger.info("No esta asociadoa  ningun hogar");
        return res.status(204).json({ msg: "TaskNotFound", tasks: [] });
      }
      const personId = req.person.id;
      // Obtener solo las tareas principales (sin padre) directamente en la consulta
      const tasks = await TaskRepository.findAllDate(
        req.body.start_date,
        personId,
        req.body.home_id,
        req.body.task_type
      );

      if (!tasks.length) {
        return res.status(204).json({ msg: "TaskNotFound", tasks: tasks });
      }
      // Mapear las tareas
      const mappedTasks = await Promise.all(
        tasks.map(async (task) => {
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            startDate: task.start_date,
            start_date: task.start_date,
            endDate: task.end_date,
            end_date: task.end_date,
            startTime: task.start_time,
            start_time: task.start_time,
            endTime: task.end_time,
            end_time: task.end_time,
            notificationDate: task.notificationDate,
            notificationTime: task.notificationTime,
            type: task.type,
            module: task.module,
            taskType: task.task_type,
            task_type: task.task_type,
            priorityId: task.priority_id,
            priority_id: task.priority_id,
            colorPriority: task.priority?.color,
            statusId: task.status_id,
            status_id: task.status_id,
            categoryId: task.category_id,
            category_id: task.category_id,
            nameCategory: task.category?.name,
            iconCategory: task.category?.icon,
            recurrence: task.recurrence,
            estimatedTime: task.estimated_time,
            estimated_time: task.estimated_time,
            comments: task.comments,
            attachments: task.attachments,
            geoLocation: task.geo_location,
            geo_location: task.geo_location,
            parentId: task.parent_id,
            parent_id: task.parent_id,
            home_id: task.home_id,
            // Personas relacionadas con la tarea
            people: await TaskRepository.peopleTask(task, personId),
            children: await TaskRepository.mapChildren(task.children, personId), // Espera el mapeo de hijos
          };
        })
      );
      const statuses = await StatusService.getStatus("Task");
      const sumaryData = await TaskRepository.getGoalSummary(
        personId,
        req.body.home_id,
        req.body.task_type,
        req.body.type,
        statuses
      )
      return res.status(200).json({ tasks: mappedTasks, status: statuses, sumaryData: sumaryData }); // Tareas encontradas
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("TaskController->getTaskDate: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async getTaskDateWeb(req, res) {
    logger.info(
      `${req.user.name} - Entra a buscar las tareas de una fecha dada`
    ); // Registro de la acción

    try {
      if (
        req.body.home_id === undefined &&
        req.body.home_id === 0 &&
        req.body.home_id === null
      ) {
        logger.info("No esta asociadoa  ningun hogar");
        return res.status(204).json({ msg: "TaskNotFound", tasks: [] });
      }
      const personId = req.person.id;
      const statuses = await StatusService.getStatus("Task");
      // Obtener solo las tareas principales (sin padre) directamente en la consulta
      const tasks = await TaskRepository.findAllDateWeb(
        req.body.start_date,
        personId,
        req.body.home_id,
        req.body.task_type,
        req.body.type,
        statuses
      );

      /*if (!tasks.length) {
        return res.status(204).json({ msg: "TaskNotFound", tasks: tasks });
      }*/
      // Mapear las tareas
      const mappedTasks = await Promise.all(
        tasks.map(async (task) => {
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            startDate: task.start_date,
            start_date: task.start_date,
            endDate: task.end_date,
            end_date: task.end_date,
            startTime: task.start_time,
            start_time: task.start_time,
            endTime: task.end_time,
            end_time: task.end_time,
            notificationDate: task.notificationDate,
            notificationTime: task.notificationTime,
            type: task.type,
            module: task.module,            
            taskType: task.task_type,
            task_type: task.task_type,
            moduleName: i18n.__(`module.${task.module}.name`) !==
              `module.${task.module}.name`
                ? i18n.__(`module.${task.module}.name`)
                : task.module,
            typeName:
              i18n.__(`typetask.${task.type}.name`) !==
              `typetask.${task.type}.name`
                ? i18n.__(`typetask.${task.type}.name`)
                : task.type,
            namePriority:
              i18n.__(`priority.${task.priority.name}.name`) !==
              `priority.${task.priority.name}.name`
                ? i18n.__(`priority.${task.priority.name}.name`)
                : task.priority.name,
            priorityId: task.priority_id,
            priority_id: task.priority_id,
            colorPriority: task.priority?.color,
            statusId: task.status_id,
            status_id: task.status_id,
            nameStatus: task.status.name,
            status:
              i18n.__(`status.${task.status.name}.name`) !==
              `status.${task.status.name}.name`
                ? i18n.__(`status.${task.status.name}.name`)
                : task.status.name,
            categoryId: task.category_id,
            category_id: task.category_id,
            nameCategory: task.category?.name,
            iconCategory: task.category?.icon,
            recurrence: task.recurrence,
            estimatedTime: task.estimated_time,
            estimated_time: task.estimated_time,
            comments: task.comments,
            attachments: task.attachments,
            geoLocation: task.geo_location,
            geo_location: task.geo_location,
            parentId: task.parent_id,
            parent_id: task.parent_id,
            home_id: task.home_id,
            // Personas relacionadas con la tarea
            people: await TaskRepository.peopleTask(task, personId),
            children: await TaskRepository.mapChildren(task.children, personId), // Espera el mapeo de hijos
          };
        })
      );
      const sumaryData = await TaskRepository.getGoalSummary(
        personId,
        req.body.home_id,
        req.body.task_type,
        req.body.type,
        statuses
      )
      return res.status(200).json({ tasks: mappedTasks, status: statuses, sumaryData: sumaryData }); // Tareas encontradas
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("TaskController->getTaskDate: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Función para mapear un padre
  /*mapParent(parent) {
        try {
            return {
                id: parent.id,
                title: parent.title,
                description: parent.description,
                start_date: parent.start_date,
                end_date: parent.end_date,
                priority_id: parent.priority_id,
                colorPriority: parent.priority.color,
                status_id: parent.status_id,
                category_id: parent.category_id,
                nameCategory: parent.category.name,
                iconCategory: parent.category.icon,
                recurrence: parent.recurrence,
                estimated_time: parent.estimated_time,
                comments: parent.comments,
                attachments: parent.attachments,
                geo_location: parent.geo_location,
                parent_id: parent.parent_id,
            };
        } catch (error) {
            logger.error('TaskController->mapParent', error.message);
        }
    },*/
  async storeBulk(req, res) {
    logger.info(`${req.user.name} - Crea nuevas tareas`);
    logger.info("Datos recibidos al crear tareas");
    logger.info(JSON.stringify(req.body));

    const personId = req.person.id;
    const tasksToCreate = req.body.tasks || [req.body];

    if (!tasksToCreate.length) {
      logger.error("No se recibieron tareas para crear");
      return res.status(400).json({ msg: "NoTasksProvided" });
    }

    // Obtener configuraciones necesarias al inicio
    const [priorities, taskRoles] = await Promise.all([
      PriorityRepository.findAll(),
      RoleRepository.getRolesType("Task"), // Obtener solo roles de tipo Task
    ]);

    // Crear mapeos para fácil acceso
    const priorityMap = {};
    priorities.forEach((p) => {
      priorityMap[p.id] = p;
    });

    const roleMap = {};
    taskRoles.forEach((role) => {
      roleMap[role.id] = role;
    });

    // Iniciar la transacción
    const t = await sequelize.transaction();
    try {
      const createdTasks = [];

      for (const taskData of tasksToCreate) {
        // Validación básica de datos requeridos
        if (!taskData.title || !taskData.type || !taskData.home_id) {
          logger.error(
            `Faltan datos requeridos en la tarea: ${JSON.stringify(taskData)}`
          );
          continue;
        }

        // Resto del código de creación de tarea (status, etc.)
        // ... (mantener todo el código existente hasta la creación de la tarea)

        // Crear la tarea
        const task = await TaskRepository.create(taskData, null, personId, t);
        createdTasks.push(task);

        // Registrar la creación en el log de actividades
        await ActivityLogService.createActivityLog(
          "Task",
          task.id,
          "create",
          req.user.id,
          JSON.stringify(task),
          task.home_id,
          { transaction: t }
        );

        // Crear asociaciones con personas y asignar puntos
        if (taskData.people && taskData.people.length > 0) {
          const filteredPeople = taskData.people.filter(
            (person) => parseInt(person.role_id) !== 0
          );

          for (const person of filteredPeople) {
            // Verificar que el rol existe y es de tipo Task
            const role = roleMap[person.role_id];
            if (!role) {
              logger.warn(
                `Rol con ID ${person.role_id} no encontrado o no es de tipo Task`
              );
              continue;
            }

            // Crear asociación
            await HomePersonTask.create(
              {
                task_id: task.id,
                person_id: person.person_id,
                role_id: person.role_id,
                home_id: person.home_id,
              },
              { transaction: t }
            );
            let pointsToAdd = 0;
            logger.info(
              `Score ${taskData.score}`);
            if (taskData.score) {
              pointsToAdd = Number(taskData.score);
            } else {
              const priority = priorityMap[taskData.priority_id];
              const basePoints = priority ? priority.level : 1; // Usar level de prioridad o 1 por defecto

              // Asignar multiplicador basado en el rol
              let roleMultiplier = 1.0; // Valor por defecto
              if (role.name === "Responsable") {
                roleMultiplier = 1.5;
              } else if (role.name === "Colaborador") {
                roleMultiplier = 1.0;
              } else if (role.name === "Creador") {
                roleMultiplier = 1.2; // Puntos adicionales para el creador
              }

              pointsToAdd = Math.round(basePoints * roleMultiplier);
            }

            // Asignar puntos
            await HomePersonRepository.addPointsToPersonInHome(
              person.home_id,
              person.person_id,
              pointsToAdd,
              { transaction: t }
            );

            logger.info(
              `Asignados ${pointsToAdd} puntos a persona ${person.person_id} por tarea ${task.id}`
            );
          }
        }
      }

      // Confirmar la transacción
      await t.commit();

      res.status(201).json({
        success: true,
        createdTasks: createdTasks.length,
        tasks: createdTasks,
        message: `Tareas creadas y puntos asignados a los participantes`,
      });
    } catch (error) {
      // Revertir la transacción si ocurre un error
      await t.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("TaskController->storeBulk: " + errorMsg);
      res.status(500).json({
        error: "ServerError",
        details: errorMsg,
      });
    }
  },
  async store(req, res) {
    logger.info(`${req.user.name} - Crea una nueva tarea`);
    logger.info("datos recibidos al crear una tarea");
    logger.info(JSON.stringify(req.body));
    const personId = req.person.id;
    const personName = req.person.name;
    let tokensData = [];
    let userTokensData = [];
    const { start_date, start_time } = req.body;
    if (req.body.parent_id) {
      parent = await TaskRepository.findById(req.body.parent_id);
      if (!parent) {
        logger.error(
          `TaskController->store: Tarea no encontrada con ID ${req.body.parent_id}`
        );
        return res.status(404).json({ msg: "ParentNotFound" });
      }
    }

    const type = "Task";
    // Obtener todos los estados de tipo "Task"
    const statuses = await StatusRepository.findByType(type);

    if (!statuses || statuses.length === 0) {
      logger.info(`No se encontraron estados para el tipo: ${type}`);
      return res.status(404).json({
        message: `No se encontraron estados para el tipo: ${type}`,
      });
    }

    // Obtener la fecha y hora actual
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5); // Formato HH:MM

    let status;

    if (start_date > currentDate) {
      // Si la fecha de inicio es mayor que la fecha actual, filtrar por "Pendiente"
      status = statuses.find((s) => s.name === "Pendiente");
    } else if (start_date === currentDate) {
      if (currentTime < start_time) {
        // Si es la fecha actual y la hora actual es menor que start_time, filtrar por "Pendiente"
        status = statuses.find((s) => s.name === "Pendiente");
      } else {
        // Si la hora actual es mayor o igual a start_time, filtrar por "Progreso"
        status = statuses.find((s) => s.name === "En Progreso");
      }
    } else {
      // Si la fecha es menor que la actual, filtrar por "Culminada"
      status = statuses.find((s) => s.name === "Completada");
    }

    if (!status) {
      logger.info(
        `No se encontró un estado válido para la fecha ${start_date} y hora ${start_time}`
      );
      return res.status(404).json({
        message: `No se encontró un estado válido para la fecha ${start_date} y hora ${start_time}`,
      });
    }

    // Asignar el id del estado filtrado a req.body.status_id
    req.body.status_id = status.id;
    let filteredPeople = [];
    if (req.body.people && req.body.people.length > 0) {
      // Filtrar las personas con role_id != 0
      // Filtrar las personas con role_id != 0
      filteredPeople = req.body.people.filter(
        (person) => parseInt(person.role_id) !== 0
      );

      // Si no quedan personas después del filtrado, devolver un error
      if (filteredPeople.length === 0) {
        logger.info("No se han proporcionado personas válidas.");
        return res
          .status(400)
          .json({ msg: "No se han proporcionado personas válidas." });
      }

      const personIds = filteredPeople.map((person) =>
        parseInt(person.person_id)
      );
      const roleIds = filteredPeople.map((person) => parseInt(person.role_id));
      const homeIds = filteredPeople.map((person) => parseInt(person.home_id));
      // Verificar personas, roles y hogares
      const [persons, roles, homes] = await Promise.all([
        Person.findAll({ where: { id: personIds } }),
        Role.findAll({ where: { id: roleIds } }),
        Home.findAll({ where: { id: homeIds } }),
      ]);
      // Comprobar si alguna entidad no existe
      const missingPersons = personIds.filter(
        (id) => !persons.find((p) => p.id === id)
      );
      const missingRoles = roleIds.filter(
        (id) => !roles.find((r) => r.id === id)
      );
      const missingHomes = homeIds.filter(
        (id) => !homes.find((h) => h.id === id)
      );

      if (missingPersons.length || missingRoles.length || missingHomes.length) {
        logger.error(`No se encontraron personas, o hogares con los siguientes IDs: 
                            Personas: ${missingPersons}, Roles: ${missingRoles}, Hogares: ${missingHomes}`);
        return res
          .status(400)
          .json({ msg: "Datos no encontrados para algunas asociaciones." });
      }

      const { tokens, userTokens } =
        await UserRepository.getUserNotificationTokensByPersons(
          personIds,
          filteredPeople
        );
      tokensData = tokens;
      userTokensData = userTokens;
    }

    let notifications = {};

    // Iniciar la transacción
    const t = await sequelize.transaction();
    try {
      const task = await TaskRepository.create(req.body, req.file, personId, t);

      // Llamada a ActivityLogService para registrar la creación
      await ActivityLogService.createActivityLog(
        "Task",
        task.id,
        "create",
        req.user.id,
        JSON.stringify(task),
        task.home_id,
      );

      //Logica de empleo de la IA, para sugerir nuevas tareas
      // Generar sugerencias solo si es una Meta
      let suggestedTasks = [];
      const validMetaTypes = ["meta", "Meta", "META"];
      logger.info(`Tipo de tarea: ${req.body.type}`);
      const isMeta =
        req.body.type &&
        typeof req.body.type === "string" &&
        req.body.type.toLowerCase() === "meta";
      logger.info(`Es una meta: ${isMeta}`);
      if (isMeta) {
        //suggestedTasks = await TaskSuggestionService.generateTaskSuggestions(req.body, task);
        try {
          // Obtener prioridades disponibles
          const priorities = await PriorityRepository.findAll();

          // 1. Primero detectamos la intención
          /*const intentResult = await IntentDetectionService.detectarIntent(
            `${req.body.title}. ${req.body.description}`
          );*/

          // 2. Solo generamos sugerencias si detectamos intención relevante
          //if (intentResult.is_meta) {
            // Construir descripción de prioridades para el prompt
            const priorityDescriptions = priorities
              .map(
                (p) =>
                  `- ID ${p.id}: ${p.name} (Nivel ${p.level}): ${p.description}`
              )
              .join("\n");

            const prompt = `
            La siguiente es una meta que ha sido creada:
            Título: ${req.body.title}
            Descripción: ${req.body.description}
            Fecha de inicio: ${req.body.start_date}
            Fecha límite: ${req.body.end_date || "No especificada"}

            Genera 5 tareas específicas que ayudarían a cumplir esta meta, distribuyéndolas inteligentemente en el período disponible. Devuélvelas en formato JSON con el siguiente formato:
            {
                "suggested_tasks": [
                    {
                        "title": "Título de la tarea 1",
                        "description": "Descripción detallada",
                        "estimated_time": "Número entero de minutos (60-480)",
                        "priority_id": "ID de prioridad válido (ver opciones abajo)",
                        "score": "Puntuación del 1 al 10 basada en complejidad e importancia",
                        "suggested_start_date": "YYYY-MM-DD (dentro del rango de la meta)",
                        "suggested_end_date": "YYYY-MM-DD (dentro del rango de la meta o null si es de un solo día)"
                    },
                    ...
                ]
            }

            Opciones de prioridad disponibles:
            ${priorityDescriptions}

            REGLAS ESTRICTAS PARA FECHAS:
            1. Si la meta TIENE fecha límite (${req.body.end_date || "NO TIENE"}):
              - Todas las tareas deben estar COMPLETAMENTE dentro del rango [${
                req.body.start_date
              } - ${req.body.end_date}]
              - suggested_start_date NO puede ser anterior a ${req.body.start_date}
              - suggested_end_date NO puede ser posterior a ${req.body.end_date}

            2. Si la meta NO TIENE fecha límite:
              - suggested_start_date DEBE ser igual o posterior a ${
                req.body.start_date
              }
              - suggested_end_date (si se especifica) DEBE ser posterior a suggested_start_date
              - El período sugerido debe ser razonable (máximo 2 semanas para tareas complejas)

            3. Distribución temporal:
              - Las tareas prioritarias (niveles altos) deben programarse antes
              - Las tareas más largas deben tener más espacio entre ellas
              - Evitar solapamientos innecesarios

            Otros requisitos:
            1. Cada tarea debe ser concreta y ejecutable
            2. Deben ser pasos lógicos para alcanzar la meta
            3. Tiempos estimados realistas (60-480 minutos)
            4. Prioridad debe ser uno de los IDs disponibles
            5. Usar el ID de prioridad, no el nombre o nivel
            6. Puntuación debe ser del 1 al 10 basada en:
              - Complejidad
              - Importancia para la meta
              - Tiempo estimado
              - Nivel de prioridad
            7. Para tareas de un solo día, suggested_end_date debe ser null
            `;
            const response = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content:
                    "Eres un experto en descomposición de metas en tareas accionables.",
                },
                { role: "user", content: prompt },
              ],
              temperature: 0.3,
              max_tokens: 1000,
              response_format: { type: "json_object" }, // Forzar respuesta en JSON
            });

            // Procesar la respuesta
            const content = response.choices[0].message.content;
            let suggestions;

            try {
              suggestions = JSON.parse(content);
            } catch (error) {
              logger.error("Error parsing JSON response from OpenAI:", error);
              throw new Error("Invalid response format from AI");
            }

            // Validar que las prioridades sean correctas
            const validPriorityIds = priorities.map((p) => p.id);
            const invalidTasks = suggestions.suggested_tasks.filter(
              (task) => !validPriorityIds.includes(task.priority_id)
            );

            if (invalidTasks.length > 0) {
              logger.error(
                "Algunas tareas sugeridas tienen prioridades inválidas"
              );
              throw new Error("Invalid priorities in suggested tasks");
            }

            // Validar que las puntuaciones estén entre 1 y 10
            const invalidScores = suggestions.suggested_tasks.filter(
              (task) => task.score < 1 || task.score > 10
            );

            if (invalidScores.length > 0) {
              logger.error(
                "Algunas tareas sugeridas tienen puntuaciones inválidas"
              );
              throw new Error("Invalid scores in suggested tasks");
            }

            // Formatear las sugerencias
            suggestedTasks = suggestions.suggested_tasks.map(
              (taskSuggestion) => {
                // Encontrar la prioridad correspondiente
                const priority = priorities.find(
                  (p) => p.id === taskSuggestion.priority_id
                );

                return {
                  ...taskSuggestion,
                  parent_id: task.id,
                  type: "Tarea",
                  module: "Tarea",                  
                  taskType: task.task_type,
                  task_type: task.task_type,
                  home_id: req.body.home_id,
                  people: req.body.people,
                  start_date:
                    taskSuggestion.suggested_start_date || req.body.start_date,
                  end_date: taskSuggestion.suggested_end_date || null,
                  start_time: req.body.start_time,
                  status_id: status.id,
                  priority_id: String(taskSuggestion.priority_id),
                  priority_name: priority ? priority.name : "Unknown", // Nombre original
                  namePriority: priority
                    ? i18n.__(`priority.${priority.name}.name`) !==
                      `priority.${priority.name}.name`
                      ? i18n.__(`priority.${priority.name}.name`)
                      : priority.name
                    : "Unknown", // Nombre traducido
                  estimated_time: String(taskSuggestion.estimated_time),
                  score: String(taskSuggestion.score),
                };
              }
            );

            logger.info(
              `Generadas ${suggestedTasks.length} tareas sugeridas para la meta ${task.id}`
            );
          //}
        } catch (error) {
          logger.error(
            "Error en el proceso de generación de sugerencias:",
            error
          );
          suggestedTasks = [];
        }
      }
      const associationsData = [];
      if (filteredPeople.length > 0) {
        // Crear las asociaciones en paralelo
        for (const person of filteredPeople) {
          const { person_id, role_id, home_id } = person;

          const personTaskAssociation = await HomePersonTask.create(
            {
              task_id: task.id,
              person_id: person_id,
              role_id,
              home_id: home_id,
              role_id,
            },
            { transaction: t }
          );

          associationsData.push({
            person_id: person,
            role_id,
            home_id: home_id,
            association_id: personTaskAssociation.id,
          });
        }
      }
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
        task.home_id,
        { transaction: t } // Aquí pasas la transacción
      );
      if (tokensData.length) {
        // Iterar sobre cada usuario y enviar notificación personalizada
        notifications = userTokensData.map((user) => ({
          token: [user.firebaseId],
          notification: {
            title: `${personName} creó la tarea ${task.title}`,
            body: `Tu Rol ${user.roleName}`,
          },
          data: {
            route: "/HomePrincipal",
            home_id: String(task.home_id), // Convertir a string
            nameHome: String(task.title),
            role_id: String(user.role_id), // Convertir a string
            roleName: String(user.roleName),
            task_id: String(task.id),
          },
        }));

        const notificationsToCreate = userTokensData
          .map((user) => {
            const notification = notifications.find(
              (n) => n.token[0] === user.firebaseId
            );
            if (notification) {
              return {
                home_id: task.home_id,
                user_id: user.user_id,
                title: `${personName} creó la tarea ${task.title} en la que apareces con el rol`,
                description: `Tu rol ${user.roleName}`,
                data: notification.data, // Usamos el valor procesado
                route: "/HomePrincipal",
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
      // Confirmar la transacción
      await t.commit();
      if (notifications.length) {
        // Enviar todas las notificaciones en paralelo
        const firebaseResults =
          await NotificationRepository.sendNotificationMultiCast(notifications);
      }
      res
        .status(201)
        .json({ task, suggestedTasks: isMeta ? suggestedTasks : undefined });
    } catch (error) {
      // Revertir la transacción si ocurre un error
      await t.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("TaskController->store: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  async generateSuggestion(req, res) {
    logger.info(
      `${req.user.name} - Solicita generación de sugerencia de tarea`
    );
    logger.info("texto recibido para crear la tarea");
    logger.info(JSON.stringify(req.body));

    const personId = req.person.id;
    try {
      if (!req.body.text || !req.body.home_id) {
        throw new Error("Texto y home_id son requeridos");
      }

      const result = await TaskSuggestionService.processTextToTask(
        req.body.text,
        req.body.home_id,
        personId
      );

      // Validación adicional de la respuesta
      if (
        !result.suggestedTask.title ||
        result.suggestedTask.title === "undefined"
      ) {
        throw new Error("No se pudo generar un título válido");
      }
      const enhancedResponse = {
        success: true,
        suggestedTask: {
          ...result.suggestedTask,
          // Normalización de campos
          people: result.suggestedTask.people || [],
          start_date: result.suggestedTask.start_date || null,
          start_time: result.suggestedTask.start_time || null,
          estimated_time: result.suggestedTask.estimated_time || null,
        },
      };
      const categories = await CategoryService.getCategories(personId, "Task"); //const categories = await TaskController.getCategories(personId);
      const statuses = await StatusService.getStatus("Task");
      const priorities = await TaskController.getPriorities();
      const people = await TaskController.getPeople(req.body.home_id); //await TaskController.getPeople(value.home_id);
      const roles = await RoleService.getRoles("Task");
      const recurrenceData = [
        { id: "Diaria", name: "Diaria" },
        { id: "Semanal", name: "Semanal" },
        { id: "Mensual", name: "Mensual" },
        { id: "Anual", name: "Anual" },
        { id: "No se repite", name: "No se repite" },
      ];

      const translatedRecurrenceData = recurrenceData.map((item) => {
        return {
          id: item.id, // El identificador único
          name: i18n.__(`recurrence.${item.name}.name`), // La traducción del nombre
          recurrenceName: item.name,
        };
      });

      const typeTaskData = [
        { id: "Tarea", name: "Tarea" },
        { id: "Meta", name: "Meta" },
      ];

      const translatedTypeTaskData = typeTaskData.map((item) => {
        return {
          id: item.id, // El identificador
          name: i18n.__(`typetask.${item.name}.name`), // El nombre traducido
        };
      });
      //res.status(200).json({ suggestedTask: enhancedResponse.suggestedTask });
      return res
        .status(200)
        .json({
          suggestedTask: enhancedResponse.suggestedTask,
          taskcategories: categories,
          taskstatus: statuses,
          taskpriorities: priorities,
          taskpeople: people,
          taskrecurrences: translatedRecurrenceData,
          taskroles: roles,
          tasktype: translatedTypeTaskData,
        }); // Tareas encontradas
    } catch (error) {
      logger.error("TaskSuggestionController error:", error);

      // Respuesta de error detallada
      res.status(500).json({
        success: false,
        error: "SuggestionFailed",
        message: error.message || "Error al generar sugerencia",
        receivedText: req.body.text, // Para debugging
        timestamp: new Date().toISOString(),
      });
    }
  },
  async show(req, res) {
    // Registro en logs de la acción realizada por el usuario
    logger.info(`${req.user.name} - Busca una tarea`);

    try {
      const { id } = req.body;

      // Consulta la tarea por su ID con las relaciones requeridas
      const task = await TaskRepository.findById(id);

      // Validación de existencia de la tarea
      if (!task) {
        return res.status(204).json({ msg: "TaskNotFound", tasks: task });
      }

      // Mapeo de datos de la tarea y sus relaciones
      const taskData = {
        id: task.id,
        title: task.title,
        description: task.description,
        startDate: task.start_date,
        endDate: task.end_date,
        startTime: task.start_time,
        endTime: task.end_time,
        type: task.type,
        priorityId: task.priority_id,
        colorPriority: task.priority.color,
        statusId: task.status_id,
        categoryId: task.category_id,
        nameCategory: task.category.name,
        iconCategory: task.category.icon,
        recurrence: task.recurrence,
        estimatedTime: task.estimated_time,
        comments: task.comments,
        attachments: task.attachments,
        geoLocation: task.geo_location,
        parentId: task.parent_id,
        people: await TaskRepository.peopleTask(task, req.person.id),
        children: await TaskRepository.mapChildren(
          task.children,
          req.person.id
        ),
      };

      // Respuesta JSON con los datos de la tarea
      return res.status(200).json({ tasks: [taskData] });
    } catch (error) {
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("TaskController->show: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar una tarea
  async update(req, res) {
    logger.info(`${req.user.name} - Actualiza la tarea con ID ${req.body.id}`);
    logger.info("datos recibidos al editar una tarea");
    logger.info(JSON.stringify(req.body));
    const personId = req.person.id;

    let task = await TaskRepository.findById(req.body.id);

    // Verificación de existencia
    if (!task) {
      return res.status(400).json({ msg: "TaskNotFound" });
    }

    if (
      req.body.parent_id !== undefined &&
      req.body.parent_id !== 0 &&
      req.body.parent_id !== null
    ) {
      parent = await TaskRepository.findById(req.body.parent_id);
      if (!parent) {
        logger.error(
          `TaskController->store: Tarea no encontrada con ID ${req.body.parent_id}`
        );
        return res.status(400).json({ msg: "ParentNotFound" });
      }
    }

    let filteredPeople = [];
    if ("people" in req.body) {
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
        const roleIds = filteredPeople.map((person) =>
          parseInt(person.role_id)
        );
        const homeIds = filteredPeople.map((person) =>
          parseInt(person.home_id)
        );

        // Verificar personas, roles y hogares
        const [persons, roles, homes] = await Promise.all([
          Person.findAll({ where: { id: personIds } }),
          Role.findAll({ where: { id: roleIds } }),
          Home.findAll({ where: { id: homeIds } }),
        ]);
        // Comprobar si alguna entidad no existe
        const missingPersons = personIds.filter(
          (id) => !persons.find((p) => p.id === id)
        );
        const missingRoles = roleIds.filter(
          (id) => !roles.find((r) => r.id === id)
        );
        const missingHomes = homeIds.filter(
          (id) => !homes.find((h) => h.id === id)
        );

        if (
          missingPersons.length ||
          missingRoles.length ||
          missingHomes.length
        ) {
          logger.error(`No se encontraron personas, roles o hogares con los siguientes IDs: 
                            Personas: ${missingPersons}, Roles: ${missingRoles}, Hogares: ${missingHomes}`);
          return res
            .status(400)
            .json({ msg: "Datos no encontrados para algunas asociaciones." });
        }
      }
    } else {
      filteredPeople = null;
    }

    const t = await sequelize.transaction();
    try {
      const updatedData = await TaskRepository.update(
        task,
        req.body,
        req.file,
        t
      );

      let associationsData = [];
      // Sincronizar asociaciones
      if (filteredPeople !== null) {
        const { toAdd, toUpdate, toDelete } =
          await TaskRepository.syncTaskPeople(
            req.body.id,
            filteredPeople,
            t,
            task
          );
        associationsData =
          toAdd.length || toUpdate.length || toDelete.length
            ? { added: toAdd, updated: toUpdate, deleted: toDelete }
            : null;
      }

      // Registrar la tarea y las asociaciones en el log de actividades
      const activityData = {
        updatedData,
        associations: associationsData,
      };

      // Llamada a ActivityLogService para registrar la creación
      await ActivityLogService.createActivityLog(
        "Task",
        task.id,
        "update",
        req.user.id,
        JSON.stringify(activityData),
        task.home_id,
      );
      await t.commit();
      res.status(200).json({ task: task });
    } catch (error) {
      if (!t.finished) {
        await t.rollback();
      }
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("TaskController->update: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  /*async syncTaskPeople(taskId, peopleArray, transaction = null) {
        // Obtener las asociaciones actuales para la tarea especificada
        const currentAssociations = await HomePersonTask.findAll({
            where: { task_id: taskId }
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
        Object.keys(newMap).forEach(key => {
            const incoming = newMap[key];
    
            // Verificar si ya existe una relación para esta combinación
            const current = currentMap[key];
    
            if (!current) {
                // Si la asociación no existe en la base de datos, agregarla
                toAdd.push({
                    task_id: taskId,
                    ...incoming
                });
            } else {
                // Si la asociación existe pero el rol ha cambiado, la actualizamos
                if (current.role_id !== incoming.role_id) {
                    toUpdate.push({
                        id: current.id,  // Usamos el id de la relación actual
                        role_id: incoming.role_id
                    });
                }
            }
        });
    
        // Recorremos las asociaciones actuales para eliminar las que ya no existen en el nuevo conjunto
        currentAssociations.forEach(current => {
            const key = `${current.person_id}-${current.home_id}`;
            if (!newMap[key]) {
                toDelete.push(current.id);
            }
        });
    
        // Aplicar las operaciones: eliminar, actualizar, agregar
        if (toDelete.length > 0) {
            await HomePersonTask.destroy({
                where: { id: toDelete },
                transaction
            });
            actions.push({ action: 'deleted', ids: toDelete });
        }
    
        if (toUpdate.length > 0) {
            for (const update of toUpdate) {
                await HomePersonTask.update(
                    { role_id: update.role_id },
                    { where: { id: update.id }, transaction }
                );
            }
            actions.push({ action: 'updated', ids: toUpdate.map(u => u.id) });
        }
    
        if (toAdd.length > 0) {
            await HomePersonTask.bulkCreate(toAdd, { transaction });
            actions.push({ action: 'added', ids: toAdd.map(a => a.id) });
        }
    
        // Devolver detalles de las operaciones realizadas
        return { toAdd, toUpdate, toDelete, actions };
    },*/

  async destroy(req, res) {
    logger.info(`${req.user.name} - Elimina tarea con ID ${req.body.id}`);

    // Buscar la tarea por ID
    const task = await TaskRepository.findById(req.body.id);

    if (!task) {
      return res.status(400).json({ msg: "TaskNotFound" });
    }

    const { people, personIds } = await TaskRepository.getTaskPeople(
      req.body.id
    );

    const { tokens, userTokens } =
      await UserRepository.getUserNotificationTokensByPersons(
        personIds,
        people
      );

    let notifications = [];
    if (tokens.length) {
      // Iterar sobre cada usuario y enviar notificación personalizada
      notifications = userTokens.map((user) => ({
        token: [user.firebaseId],
        notification: {
          title: `La tarea ${task.title} fue eliminada`,
          body: /*`Tu Rol ${user.roleName}`*/ "",
        },
        data: {
          route: "/getHome",
          home_id: String(task.home_id), // Convertir a string
          nametask: String(task.name),
          //role_id: String(user.role_id), // Convertir a string
          //roleName: String(user.roleName),
          task_id: String(task.id),
        },
      }));

      const notificationsToCreate = userTokens
        .map((user) => {
          const notification = notifications.find(
            (n) => n.token[0] === user.firebaseId
          );
          if (notification) {
            return {
              home_id: task.home_id,
              user_id: user.user_id,
              title: `La tarea ${task.title} fue eliminada`,
              description: /*`Tu rol ${user.roleName}`*/ "",
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
            const result = await NotificationRepository.create(notification);
          } catch (error) {
            logger.error(
              `Error al crear notificación para user_id ${notification.user_id}:`,
              error
            );
          }
        })
      );
    }

    if (notifications.length) {
      // Enviar todas las notificaciones en paralelo
      const firebaseResults =
        await NotificationRepository.sendNotificationMultiCast(notifications);
    }

    const t = await sequelize.transaction();
    try {
      const taskUpdate = await TaskRepository.delete(task, t);
      // Llamada a ActivityLogService para registrar la creación
      await ActivityLogService.createActivityLog(
        "Task",
        task.id,
        "delete",
        req.user.id,
        JSON.stringify(task),
        task.home_id
      );

      await t.commit();

      res.status(200).json({ msg: "TaskDeleted" });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("TaskController->destroy: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  //Ruta unificada de Mantenedores
  async category_status_priority(req, res) {
    logger.info(`${req.user.name} - Entra a la ruta unificada de Tasks`);
    // Verificar si el hogar existe
    const home = await HomeRepository.findById(req.body.home_id);
    if (!home) {
      logger.error(
        `TaskController->category_status_priority: Hogar no encontrado con ID ${req.body.home_id}`
      );
      return res.status(400).json({ msg: "HomeNotFound" });
    }

    // Obtén el ID de la persona autenticada
    const personId = req.person.id;
    // Establecer el idioma de i18n dinámicamente
    if (!personId) {
      return res.status(400).json({ error: "Persona no encontrada" });
    }
    try {
      const categories = await CategoryService.getCategories(personId, "Task"); //const categories = await TaskController.getCategories(personId);
      const statuses = await StatusService.getStatus("Task");
      const priorities = await TaskController.getPriorities();
      const people = await TaskController.getPeople(req.body.home_id); //await TaskController.getPeople(value.home_id);
      const roles = await RoleService.getRoles("Task");
      const recurrenceData = [
        { id: "Diaria", name: "Diaria" },
        { id: "Semanal", name: "Semanal" },
        { id: "Mensual", name: "Mensual" },
        { id: "Anual", name: "Anual" },
        { id: "No se repite", name: "No se repite" },
      ];

      const translatedRecurrenceData = recurrenceData.map((item) => {
        return {
          id: item.id, // El identificador único
          name: i18n.__(`recurrence.${item.name}.name`), // La traducción del nombre
          recurrenceName: item.name,
        };
      });

      const typeTaskData = [
        { id: "Tarea", name: "Tarea" },
        { id: "Meta", name: "Meta" },
      ];

      const translatedTypeTaskData = typeTaskData.map((item) => {
        return {
          id: item.id, // El identificador
          name: i18n.__(`typetask.${item.name}.name`), // El nombre traducido
        };
      });

      const typeData = [
                   { id: "Personal", name: "Personal", description: "Registro financiero personal" },
                   { id: "Hogar", name: "Hogar", description: "Registro financiero del hogar" }
                     ];
           
                     const translatedTypeData = typeData.map((item) => ({
                   id: item.id,
                   name: i18n.__(`financeType.${item.id}.name`) !== `financeType.${item.id}.name`
                         ? i18n.__(`financeType.${item.id}.name`)
                         : item.name,
                   description: i18n.__(`financeType.${item.id}.description`) !== `financeType.${item.id}.description`
                         ? i18n.__(`financeType.${item.id}.description`)
                         : item.description,
                   originalName: item.name
                 }));

      res.json({
        taskcategories: categories,
        taskstatus: statuses,
        taskpriorities: priorities,
        taskpeople: people,
        taskrecurrences: translatedRecurrenceData,
        taskroles: roles,
        tasktype: translatedTypeTaskData,
        tasktypetask: translatedTypeData,
      });
    } catch (error) {
      logger.error("Error al obtener categorías:", error);
      res.status(500).json({ error: "Error al obtener categorías" });
    }
  },
  async getPriorities() {
    logger.info("Entra a Buscar Las prioridades en (category_status_priority)");
    try {
      const priorities = await PriorityRepository.findAll(); // Obtén todas las prioridades

      return priorities.map((priority) => {
        return {
          id: priority.id,
          name: priority.name,
          namePriority:
            i18n.__(`priority.${priority.name}.name`) !==
            `priority.${priority.name}.name`
              ? i18n.__(`priority.${priority.name}.name`)
              : priority.name,
          descriptionPriority:
            i18n.__(`priority.${priority.name}.name`) !==
            `priority.${priority.name}.name`
              ? i18n.__(`priority.${priority.name}.description`)
              : priority.description,
          colorPriority: priority.color,
          level: priority.level,
        };
      });
    } catch (error) {
      logger.error("Error en getPriorities:", error);
      throw new Error("Error al obtener prioridades");
    }
  },

  async getPeople(home_id) {
    logger.info("Entra a Buscar Las personas en (category_status_priority)");
    try {
      const people = await Person.findAll({
        include: [
          {
            model: HomePerson, // Incluye la relación con home_person
            as: "homePeople", // Asegúrate de que coincida con la definición en el modelo
            where: { home_id: home_id }, // Filtrar por el home_id específico
            required: true, // Asegurarse de que solo se incluyan personas asociadas al home_id
            include: [
              {
                model: Role, // Incluir el modelo de Role
                as: "role", // Relación de roles
                required: false, // Permitir que devuelva personas sin roles
              },
            ],
          },
        ],
      });

      return people.map((person) => {
        const firstHome = person.homePeople[0]; // Obtener la primera relación
        return {
          id: person.id,
          namePerson: person.name,
          imagePerson: person.image,
          roleId: firstHome ? firstHome.role_id : 0, // Accede a role_id
          roleName:
            firstHome && firstHome.role
              ? i18n.__(`roles.${firstHome.role.name}.name`) !==
                `roles.${firstHome.role.name}.name`
                ? i18n.__(`roles.${firstHome.role.name}.name`)
                : firstHome.role.name
              : "Sin Rol", // Accede a role.name
        };
      });
    } catch (error) {
      logger.error("Error en getPeople:", error);
      throw new Error("Error al obtener personas");
    }
  },

  async createPointsAndTasks(req, res) {
    const { home_id, task_id, people } = req.body;

    // Verificar que el home_id exista en la tabla home
    const home = await HomeRepository.findById(home_id);
    if (!home) {
      return res.status(404).json({
        message: `No se encontró un hogar con el id: ${home_id}`,
      });
    }

    // Verificar que el home_id exista en la tabla home
    const task = await TaskRepository.findById(task_id);
    if (!task) {
      return res.status(404).json({
        message: `No se encontró una tarea con el id: ${task_id}`,
      });
    }

    // Extraer todos los person_id del array de actualizaciones
    const personIds = people.map((update) => update.person_id);

    // Verificar que todos los person_id existan en la tabla person
    const persons = await PersonRepository.findByIds(personIds);

    // Comprobar si faltan person_id
    const missingPersonIds = personIds.filter(
      (id) => !persons.find((p) => p.id === id)
    );

    // Si faltan person_id, devolver un error
    if (missingPersonIds.length > 0) {
      logger.error(
        `No se encontraron los siguientes person_id en la tabla person: ${missingPersonIds}`
      );
      return res.status(400).json({
        message: "Datos no encontrados para algunas personas.",
        missingPersonIds,
      });
    }

    const t = await sequelize.transaction(); // Iniciar una transacción
    try {
      // Llamar al método del repositorio para actualizar puntos y tareas
      await TaskRepository.createPointsAndTasks(home_id, people, t);

      // Commit de la transacción si todo está bien
      await t.commit();

      // Devolver una respuesta exitosa
      res.status(200).json({
        message: "Puntos y tareas actualizados exitosamente.",
      });
    } catch (error) {
      // Rollback en caso de error
      await t.rollback();
      logger.error(`Error en updatePointsAndTasks: ${error.message}`);
      res.status(500).json({
        message: "Error al actualizar puntos y tareas",
        error: error.message,
      });
    }
  },

  async updatePointsAndTasks(req, res) {
    const { home_id, task_id, people } = req.body;

    // Verificar que el home_id exista en la tabla home
    const home = await HomeRepository.findById(home_id);
    if (!home) {
      return res.status(404).json({
        message: `No se encontró un hogar con el id: ${home_id}`,
      });
    }

    // Verificar que el task_id exista en la tabla task
    const task = await TaskRepository.findById(task_id);
    if (!task) {
      return res.status(404).json({
        message: `No se encontró una tarea con el id: ${task_id}`,
      });
    }

    // Extraer todos los person_id del array de actualizaciones
    const personIds = people.map((update) => update.person_id);

    // Verificar que todos los person_id existan en la tabla person
    const persons = await PersonRepository.findByIds(personIds);

    // Comprobar si faltan person_id
    const missingPersonIds = personIds.filter(
      (id) => !persons.find((p) => p.id === id)
    );

    // Si faltan person_id, devolver un error
    if (missingPersonIds.length > 0) {
      logger.error(
        `No se encontraron los siguientes person_id en la tabla person: ${missingPersonIds}`
      );
      return res.status(400).json({
        message: "Datos no encontrados para algunas personas.",
        missingPersonIds,
      });
    }

    const t = await sequelize.transaction(); // Iniciar una transacción
    try {
      // Obtener los puntos actuales de home_person_task para cada persona
      const updatesWithCurrentPoints = await Promise.all(
        people.map(async (person) => {
          const homePersonTask = await HomePersonTask.findOne({
            where: {
              home_id,
              task_id,
              person_id: person.person_id,
            },
            transaction: t,
          });

          return {
            ...person,
            pointsToSubtract: homePersonTask ? homePersonTask.points : 0, // Puntos actuales en home_person_task
          };
        })
      );

      // Llamar al método del repositorio para actualizar puntos y tareas
      await TaskRepository.updatePointsAndTasks(
        home_id,
        updatesWithCurrentPoints,
        t
      );

      // Commit de la transacción si todo está bien
      await t.commit();

      // Devolver una respuesta exitosa
      res.status(200).json({
        message: "Puntos y tareas actualizados exitosamente.",
      });
    } catch (error) {
      // Rollback en caso de error
      await t.rollback();
      logger.error(`Error en createPointsAndTasks: ${error.message}`);
      res.status(500).json({
        message: "Error al actualizar puntos y tareas",
        error: error.message,
      });
    }
  },

  async verificTasksEarrings() {
    try {
      // Obtener tareas para notificación
      const tasks = await TaskRepository.getTasksForNotification();
      let tokensData = [];
      let userTokensData = [];
      let notifications = {};
      if (!tasks.length) {
        return { message: "No hay tareas para notificación." };
      }
      // Mapear tareas y enviar notificaciones
      for (const task of tasks) {
        const homepersontasks = task.homePersonTasks;

        if (
          homepersontasks &&
          Array.isArray(homepersontasks) &&
          homepersontasks.length > 0
        ) {
          const personIds = homepersontasks.map((person) =>
            parseInt(person.person_id)
          );

          const { tokens, userTokens } =
            await UserRepository.getUserNotificationTokensByPersons(
              personIds,
              homepersontasks
            );
          tokensData = tokens;
          userTokensData = userTokens;
          logger.info("JSON.stringify(userTokensData)");
          logger.info(JSON.stringify(userTokensData));
          if (tokensData.length) {
            // Iterar sobre cada usuario y enviar notificación personalizada
            notifications = userTokensData
              .map((user) => {
                // Filtrar homepersontasks para obtener el registro que coincide con user.person_id
                const homePersonTask = homepersontasks.find(
                  (hpt) => hpt.person_id === user.person_id
                );

                // Obtener el nombre del rol desde el registro filtrado
                const userRole = homePersonTask.role.name || "Sin Rol";

                // Devolver la notificación personalizada
                return {
                  token: [user.firebaseId], // Token de Firebase del usuario
                  notification: {
                    title: `Recordatorio de Tarea "${task.title}"`, // Título de la notificación
                    body: `Recuerda que tienes la tarea "${task.title}" del hogar ${task.home.name} el día ${task.start_date} a las ${task.start_time}`,
                  },
                  data: {
                    route: "/HomePrincipal", // Ruta de la aplicación
                    home_id: String(task.home_id), // Convertir a string
                    nameHome: String(task.title), // Nombre de la tarea o del hogar
                    role_id: String(homePersonTask.role_id), // Convertir a string
                    roleName: String(userRole), // Nombre del rol del usuario
                    task_id: String(task.id), // ID de la tarea
                  },
                };
              })
              .filter((notification) => notification !== null); // Eliminar elementos null

            const notificationsToCreate = userTokensData
              .map((user) => {
                const notification = notifications.find(
                  (n) => n.token[0] === user.firebaseId
                );
                const homePersonTask = homepersontasks.find(
                  (hpt) => hpt.person_id === user.person_id
                );

                // Obtener el nombre del rol desde el registro filtrado
                const userRole = homePersonTask.roleName || "Sin Rol";
                if (notification) {
                  return {
                    home_id: task.home_id,
                    user_id: user.user_id,
                    title: `Recordatorio de Tarea "${task.title}"`,
                    description: `Recuerda que tienes la tarea "${task.title}" del hogar ${task.home.name} el día ${task.start_date} a las ${task.start_time}. Tu Rol: ${userRole}`,
                    data: notification.data, // Usamos el valor procesado
                    route: "/HomePrincipal",
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
          } //for de usuario asociados a la tarea
        } //if de que hay usuarios asociados a la tarea
        if (notifications.length) {
          // Enviar todas las notificaciones en paralelo
          const firebaseResults =
            await NotificationRepository.sendNotificationMultiCast(
              notifications
            );
        }
      } //for de tareas del día
    } catch (error) {
      logger.error(`Error en verificTasksEarrings: ${error.message}`);
      throw error;
    }
  },
};

module.exports = TaskController;
