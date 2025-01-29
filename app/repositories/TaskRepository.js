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

class TaskRepository {
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
  }

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
  }

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
  }

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
  }

  async peopleTask(task, personId) {
    const homePersonTasks = await HomePersonTask.findAll({
            where: { task_id: task.id },
            include: [
                {
                    model: Role,
                    as: 'role',
                },
                {
                    model: Person,
                    as: 'person',
                }
            ]
        });

        // Devolver las personas mapeadas
        let people = homePersonTasks.map(homePersonTask => ({
            id: homePersonTask.person_id,
            name: homePersonTask.person.name,
            image: homePersonTask.person.image,
            roleId: homePersonTask.role_id,
            roleName: homePersonTask.role.name,
            roleName: i18n.__(`roles.${homePersonTask.role.name}.name`) !== `roles.${homePersonTask.role.name}.name`
            ? i18n.__(`roles.${homePersonTask.role.name}.name`) // Traducción del rol si está disponible
            : homePersonTask.role.name,
        }));
        // Verificar si la persona que hace la consulta tiene relación directa con la tarea
    const personAlreadyIncluded = people.some(person => person.id === personId);
    // Si la persona no está relacionada, se agrega solo como "Creador"
    if (!personAlreadyIncluded && task.person_id === personId) {
        const person = await Person.findByPk(personId); // Obtener los detalles de la persona
        if (person) {
            people.push({
                id: task.person_id,
                name: person.name,
                image: person.image,
                roleId: 0,
                roleName: i18n.__(`roles.${'Creador'}.name`) !== `roles.${'Creador'}.name`
                ? i18n.__(`roles.${'Creador'}.name`) // Traducción del rol si está disponible
                : 'Creador'
            });
        }
    }   

    return people;
    /*const homePersonTasks = await Person.findAll({
        include: [
            {
                model: HomePersonTask, // Relación con HomePersonTask para verificar si está asociado a la tarea
                as: "homePersonTasks",
                where: { task_id: task.id }, // Filtrar por la tarea asociada
                required: true, // Permite que no todas las personas tengan relación con la tarea
                include: [
                    {
                        model: Role, // Incluir el modelo de Role relacionado con la tarea
                        as: 'role',
                    },
                    {
                        model: Person, // Incluir la relación con la persona
                        as: 'person',
                    }
                ]
            }
        ],
    });
    // Ahora mapeamos las personas con el rol correcto
    return homePersonTasks.map((person) => {
      // Obtenemos el primer HomePerson (ya que es un array)
      const homePerson = person.homePeople[0]; // Primero se toma el rol del hogar
      const homePersonTask = person.homePersonTasks[0]; // Luego se toma el rol de la tarea

      let roleId = 0;
      let roleName = "Sin Rol";

      // Si la persona tiene un rol en la tarea, se utiliza ese rol
      if (homePersonTask && homePersonTask.role) {
        roleId = homePersonTask.role.id;
        roleName = homePersonTask.role.name;
      }
      // Si no tiene un rol en la tarea, se usa el rol del hogar
      else if (person.id === personId) {
        roleId = 0;
        roleName = 'Creador';
      }
      else{
        roleId = homePerson.role.id;
        roleName = homePerson.role.name;
      }

      return {
        id: person.id,
        name: person.name,
        image: person.image,
        roleId: roleId, // ID del rol
        select: homePersonTask || person.id === personId ? 1 : 0, // ID del rol
        roleName:
          i18n.__(`roles.${roleName}.name`) !== `roles.${roleName}.name`
            ? i18n.__(`roles.${roleName}.name`) // Traducción del rol si está disponible
            : roleName, // Si no hay traducción, usar el nombre original del rol
      };
    });*/
  }

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
  }

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
  }

  async delete(task, t) {
    if (task.attachments && task.attachments !== "tasks/default.jpg") {
      await ImageService.deleteFile(task.attachments);
    }

    return await task.destroy({ transaction: t });
  }

  async syncTaskPeople(taskId, peopleArray, t) {
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

    // Devolver detalles de las operaciones realizadas
    return { toAdd, toUpdate, toDelete, actions };
  }
}

module.exports = new TaskRepository();
