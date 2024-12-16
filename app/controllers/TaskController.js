const Joi = require('joi');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Task, Priority, Status, Category, Person, HomePersonTask, Role, Home, HomePerson, sequelize } = require('../models');  // Importar el modelo Home
const logger = require('../../config/logger'); // Importa el logger
const { CategoryService, StatusService, ActivityLogService, RoleService } = require('../services');
const i18n = require('../../config/i18n-config');
const { TaskRepository, HomeRepository, PriorityRepository } = require('../repositories');

const TaskController = {
    // Obtener todas las tareas
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar las tareas`); // Registro de la acción
        try {
            // Obtener solo las tareas principales (sin padre) directamente en la consulta
            const tasks = await TaskRepository.findAll();

            if (!tasks.length) {
                return res.status(204).json({ msg: 'TaskNotFound', tasks: tasks });
            }


            // Mapear las tareas
            const mappedTasks = await Promise.all(tasks.map(async (task) => {
                return {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    startDate: task.start_date,
                    endDate: task.end_date,
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
                    people: await TaskRepository.peopleTask(task),
                    children: await TaskRepository.mapChildren(task.children), // Espera el mapeo de hijos
                };
            }));

            return res.status(200).json({ tasks: mappedTasks }); // Tareas encontradas
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('TaskController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async getTaskDate(req, res) {
        logger.info(`${req.user.name} - Entra a buscar las tareas de una fecha dada`); // Registro de la acción

        try {
            const personId = req.person.id;
            // Obtener solo las tareas principales (sin padre) directamente en la consulta
            const tasks = await TaskRepository.findAllDate(req.body.start_date, personId);

            if (!tasks.length) {
                return res.status(204).json({ msg: 'TaskNotFound', tasks: tasks });
            }
            // Mapear las tareas
            const mappedTasks = await Promise.all(tasks.map(async (task) => {
                return {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    startDate: task.start_date,
                    endDate: task.end_date,
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
                    // Personas relacionadas con la tarea
                    people: await TaskRepository.peopleTask(task),
                    children: await TaskRepository.mapChildren(task.children) // Espera el mapeo de hijos
                };
            }));

            return res.status(200).json({ tasks: mappedTasks }); // Tareas encontradas
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('TaskController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
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

    async store(req, res) {
        logger.info(`${req.user.name} - Crea una nueva tarea`);
        logger.info('datos recibidos al crear una tarea');
        logger.info(JSON.stringify(req.body));
        const personId = req.person.id;
   
        if (req.body.parent_id) {
            parent = await TaskRepository.findById(req.body.parent_id);
            if (!parent) {
                logger.error(`TaskController->store: Tarea no encontrada con ID ${req.body.parent_id}`);
                return res.status(404).json({ msg: 'ParentNotFound' });
            }
        }

        // Verificar existencia de personas, roles y hogares antes de crear la tarea
        if (req.body.people && req.body.people.length > 0) {
            const personIds = req.body.people.map(person => person.person_id);
            const roleIds = req.body.people.map(person => person.role_id);
            const homeIds = req.body.people.map(person => person.home_id);

            // Verificar personas, roles y hogares
            const [persons, roles, homes] = await Promise.all([
                Person.findAll({ where: { id: personIds } }),
                Role.findAll({ where: { id: roleIds } }),
                Home.findAll({ where: { id: homeIds } })
            ]);

            // Comprobar si alguna entidad no existe
            const missingPersons = personIds.filter(id => !persons.find(p => p.id === id));
            const missingRoles = roleIds.filter(id => !roles.find(r => r.id === id));
            const missingHomes = homeIds.filter(id => !homes.find(h => h.id === id));

            if (missingPersons.length || missingRoles.length || missingHomes.length) {
                logger.error(`No se encontraron personas, roles o hogares con los siguientes IDs: 
                            Personas: ${missingPersons}, Roles: ${missingRoles}, Hogares: ${missingHomes}`);
                return res.status(400).json({ msg: 'Datos no encontrados para algunas asociaciones.' });
            }

            

        // Agregar el creador si no está incluido
        if (!personIds.includes(personId)) {
            logger.info(`Agregando automáticamente al creador con personId: ${personId}`);

            // Buscar el rol "Creador"
            const creatorRole = await Role.findOne({ where: { name: 'Creador' } });
            if (!creatorRole) {
                logger.error('No se encontró el rol "Creador" en la base de datos.');
                return res.status(500).json({ msg: 'RoleNotFound' });
            }

            const defaultHomeId = req.body.people?.[0]?.home_id || null; // Usar un home_id del array o null
            req.body.people = [
                ...(req.body.people || []),
                {
                    person_id: personId,
                    role_id: creatorRole.id,
                    home_id: defaultHomeId
                }
            ];
        }
        }
    
        // Iniciar la transacción
        const t = await sequelize.transaction();
        try {

            const task = await TaskRepository.create(req.body, req.file, t);
            
            // Llamada a ActivityLogService para registrar la creación
            await ActivityLogService.createActivityLog('Task', task.id, 'create', req.user.id, JSON.stringify(task));

            const associationsData = [];
            if (req.body.people && req.body.people.length > 0) {
                // Crear las asociaciones en paralelo
                for (const person of req.body.people) {
                    const { person_id, role_id, home_id } = person;
    
                    const personTaskAssociation = await HomePersonTask.create({
                        task_id: task.id,
                        person_id,
                        role_id,
                        home_id
                    }, { transaction: t });
    
                    associationsData.push({
                        person_id,
                        role_id,
                        home_id,
                        association_id: personTaskAssociation.id
                    });
                }
            }
             // Registrar la tarea y las asociaciones en el log de actividades
            const activityData = {
                task,
                associations: associationsData
            };
            await ActivityLogService.createActivityLog(
                'TaskWithAssociations',
                task.id,
                'create',
                req.user.id,
                JSON.stringify(activityData),
                { transaction: t }  // Aquí pasas la transacción
            );
            // Confirmar la transacción
            await t.commit();
            res.status(201).json({ task });
        } catch (error) {
            // Revertir la transacción si ocurre un error
            await t.rollback();
            const errorMsg = error.message || 'Error desconocido';
            logger.error('TaskController->store: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
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
                return res.status(204).json({ msg: 'TaskNotFound', tasks: task });
            }

            // Mapeo de datos de la tarea y sus relaciones
            const taskData = {
                id: task.id,
                title: task.title,
                description: task.description,
                startDate: task.start_date,
                endDate: task.end_date,
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
                people: await TaskRepository.peopleTask(task),
                children: await TaskRepository.mapChildren(task.children)
            };

            // Respuesta JSON con los datos de la tarea
            return res.status(200).json({ tasks: [taskData] });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('TaskController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Actualizar una tarea
    async update(req, res) {
        logger.info(`${req.user.name} - Actualiza la tarea con ID ${req.body.id}`);
        logger.info('datos recibidos al editar una tarea');
        logger.info(JSON.stringify(req.body));
        const personId = req.person.id;

        let task = await TaskRepository.findById(req.body.id);
    
            // Verificación de existencia
            if (!task) {
                return res.status(400).json({ msg: 'TaskNotFound' });
            }

        if (req.body.parent_id !== undefined && req.body.parent_id !== 0 && req.body.parent_id !== null) {
            parent = await TaskRepository.findById(req.body.parent_id);
            if (!parent) {
                logger.error(`TaskController->store: Tarea no encontrada con ID ${req.body.parent_id}`);
                return res.status(400).json({ msg: 'ParentNotFound' });
            }
        }

        // Verificar existencia de personas, roles y hogares antes de crear la tarea
        if (req.body.people && req.body.people.length > 0) {
            const personIds = req.body.people.map(person => person.person_id);
            const roleIds = req.body.people.map(person => person.role_id);
            const homeIds = req.body.people.map(person => person.home_id);

            // Verificar personas, roles y hogares
            const [persons, roles, homes] = await Promise.all([
                Person.findAll({ where: { id: personIds } }),
                Role.findAll({ where: { id: roleIds } }),
                Home.findAll({ where: { id: homeIds } })
            ]);

            // Comprobar si alguna entidad no existe
            const missingPersons = personIds.filter(id => !persons.find(p => p.id === id));
            const missingRoles = roleIds.filter(id => !roles.find(r => r.id === id));
            const missingHomes = homeIds.filter(id => !homes.find(h => h.id === id));

            if (missingPersons.length || missingRoles.length || missingHomes.length) {
                logger.error(`No se encontraron personas, roles o hogares con los siguientes IDs: 
                            Personas: ${missingPersons}, Roles: ${missingRoles}, Hogares: ${missingHomes}`);
                return res.status(400).json({ msg: 'Datos no encontrados para algunas asociaciones.' });
            }

            // Agregar el creador si no está incluido
            if (!personIds.includes(personId)) {
                logger.info(`Agregando automáticamente al creador con personId: ${personId}`);

                // Buscar el rol "Creador"
                const creatorRole = await Role.findOne({ where: { name: 'Creador' } });
                if (!creatorRole) {
                    logger.error('No se encontró el rol "Creador" en la base de datos.');
                    return res.status(500).json({ msg: 'RoleNotFound' });
                }

                const defaultHomeId = req.body.people?.[0]?.home_id || null; // Usar un home_id del array o null
                req.body.people = [
                    ...(req.body.people || []),
                    {
                        person_id: personId,
                        role_id: creatorRole.id,
                        home_id: defaultHomeId
                    }
                ];
            }
        }
    
        const t = await sequelize.transaction();
        try {    
            
            const updatedData = await TaskRepository.update(task, req.body, req.file, t);

            let associationsData = [];
            // Sincronizar asociaciones
            if (req.body.people && req.body.people.length > 0) {
                const { toAdd, toUpdate, toDelete } = await TaskRepository.syncTaskPeople(req.body.id, req.body.people, t);
                associationsData = toAdd.length || toUpdate.length || toDelete.length
                ? { added: toAdd, updated: toUpdate, deleted: toDelete }
                : null;
            }

             // Registrar la tarea y las asociaciones en el log de actividades
             const activityData = {
                updatedData,
                associations: associationsData
            };
            
            // Llamada a ActivityLogService para registrar la creación
            await ActivityLogService.createActivityLog('Task', task.id, 'update', req.user.id, JSON.stringify(activityData));
            await t.commit();
            res.status(200).json({ 'task': task });
        } catch (error) {
            if (!t.finished) {
                await t.rollback();
            }
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
    
            logger.error('TaskController->update: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
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
                return res.status(400).json({ msg: 'TaskNotFound' });
            }

        const t = await sequelize.transaction();
        try {
    
           const taskUpdate = await TaskRepository.delete(task, t);
            // Llamada a ActivityLogService para registrar la creación
            await ActivityLogService.createActivityLog('Task', task.id, 'delete', req.user.id, JSON.stringify(task));

            await t.commit();
    
            res.status(200).json({ msg: 'TaskDeleted' });
        } catch (error) {
            await t.rollback();
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
    
            logger.error('TaskController->destroy: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    //Ruta unificada de Mantenedores
    async category_status_priority(req, res){
        logger.info(`${req.user.name} - Entra a la ruta unificada de Tasks`);
         // Verificar si el hogar existe
         const home = await HomeRepository.findById(req.body.home_id);
         if (!home) {
             logger.error(`TaskController->category_status_priority: Hogar no encontrado con ID ${req.body.home_id}`);
             return res.status(400).json({ msg: 'HomeNotFound' });
         }

         // Obtén el ID de la persona autenticada
         const personId = req.person.id;
        // Establecer el idioma de i18n dinámicamente
         if (!personId) {
             return res.status(400).json({ error: 'Persona no encontrada' });
         }
        try {
           const categories = await CategoryService.getCategories(personId, "Task");//const categories = await TaskController.getCategories(personId);
           const statuses = await StatusService.getStatus("Task");
           const priorities = await TaskController.getPriorities();
           const people = await TaskController.getPeople(req.body.home_id);//await TaskController.getPeople(value.home_id);
           const roles = await RoleService.getRoles("Task");
           const recurrenceData = [
            'Diaria',
            'Semanal',
            'Mensual',
            'Anual'
        ];
        const translatedRecurrenceData = recurrenceData.map(item => {
            return i18n.__(`recurrence.${item}.name`);
        });
    
            res.json({
                taskcategories: categories,
                taskstatus: statuses,
                taskpriorities: priorities,
                taskpeople: people,
                taskrecurrences: translatedRecurrenceData,
                taskroles: roles
            });
        } catch (error) {
            logger.error('Error al obtener categorías:', error);
            res.status(500).json({ error: 'Error al obtener categorías' });
        }
    },
    async getPriorities() {
        logger.info('Entra a Buscar Las prioridades en (category_status_priority)');
        try {
            const priorities = await PriorityRepository.findAll(); // Obtén todas las prioridades
    
            return priorities.map(priority => {

                return {
                    id: priority.id,
                    namePriority: i18n.__(`priority.${priority.name}.name`) !== `priority.${priority.name}.name` ? i18n.__(`priority.${priority.name}.name`) : priority.name,
                    descriptionPriority: i18n.__(`priority.${priority.name}.name`) !== `priority.${priority.name}.name` ? i18n.__(`priority.${priority.name}.description`) : priority.description,
                    colorPriority: priority.color,
                    level: priority.level
                };
            });
        } catch (error) {
            logger.error('Error en getPriorities:', error);
            throw new Error('Error al obtener prioridades');
        }
    },
    async getPeople(home_id) {
        logger.info('Entra a Buscar Las personas en (category_status_priority)');
        try {
            const people = await Person.findAll({
                include: [
                    {
                        model: HomePerson, // Incluye la relación con home_person
                        as: 'homePeople', // Asegúrate de que coincida con la definición en el modelo
                        where: { home_id: home_id }, // Filtrar por el home_id específico
                        required: true, // Asegurarse de que solo se incluyan personas asociadas al home_id
                        include: [
                            {
                                model: Role, // Incluir el modelo de Role
                                as: 'role', // Relación de roles
                                required: false // Permitir que devuelva personas sin roles
                            }
                        ]
                    }
                ]
            });

            return people.map(person => {
                const firstHome = person.homePeople[0]; // Obtener la primera relación
                return {
                    id: person.id,
                    namePerson: person.name,
                    imagePerson: person.image,
                    roleId: firstHome ? firstHome.role_id : 0, // Accede a role_id
                    roleName: firstHome && firstHome.role ? firstHome.role.name : 'Sin Rol' // Accede a role.name
                };
            });
        } catch (error) {
            logger.error('Error en getPeople:', error);
            throw new Error('Error al obtener personas');
        }
    }
};

module.exports = TaskController;
