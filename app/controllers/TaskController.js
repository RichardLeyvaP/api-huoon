const Joi = require('joi');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Task, Priority, Status, Category, Person, HomePersonTask, Role, Home, HomePerson, sequelize } = require('../models');  // Importar el modelo Home
const logger = require('../../config/logger'); // Importa el logger
const { CategoryService, StatusService, ActivityLogService, RoleService } = require('../services');
const i18n = require('../../config/i18n-config');

// Esquema de validación de Joi
const schema = Joi.object({
    title: Joi.string()
        .max(255)
        .optional(),
    description: Joi.string().optional().allow(null, '').empty('').default(null),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    priority_id: Joi.number().integer().optional(),
    parent_id: Joi.number().integer().optional().allow(null),
    status_id: Joi.number().integer().optional(),
    category_id: Joi.number().integer().optional(),
    recurrence: Joi.string().optional().allow(null), // Puede ser nulo o cadena vacía
    estimated_time: Joi.number().integer().optional().allow(null),
    comments: Joi.string().optional().allow(null), // Puede ser nulo o cadena vacía
    attachments: Joi.string().optional(), // Puede ser nulo o cadena vacía
    geo_location: Joi.string().optional().allow(null, '').empty('').default(null),
    id: Joi.number().optional().allow(null),
    people: Joi.array().items(
        Joi.object({
            person_id: Joi.number().required(),
            role_id: Joi.number().required(),
            home_id: Joi.number().required()
        })
    ).optional()
});

const TaskController = {
    // Obtener todas las tareas
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar las tareas`); // Registro de la acción
        try {
            // Obtener solo las tareas principales (sin padre) directamente en la consulta
            const tasks = await Task.findAll({
                where: { parent_id: null },
                include: [
                    { model: Priority, as: 'priority' },
                    { model: Status, as: 'status' },
                    { model: Category, as: 'category' },
                    {
                        model: Task,
                        as: 'children',
                        include: [
                            { model: Priority, as: 'priority' },
                            { model: Status, as: 'status' },
                            { model: Category, as: 'category' },
                            {
                                model: HomePersonTask,
                                as: 'homePersonTasks',
                                include: [
                                    {
                                        model: Role,
                                        as: 'role', // Debe coincidir con la definición en el modelo
                                    },
                                    {
                                        model: Person,
                                        as: 'person', // Incluir persona si también es necesario
                                    },
                                    {
                                        model: Home,
                                        as: 'home', // Incluir persona si también es necesario
                                    }
                                ],
                            },
                        ]
                    },
                    {
                        model: HomePersonTask,
                        as: 'homePersonTasks',
                        include: [
                            {
                                model: Role,
                                as: 'role', // Debe coincidir con la definición en el modelo
                            },
                            {
                                model: Person,
                                as: 'person', // Incluir persona si también es necesario
                            },
                            {
                                model: Home,
                                as: 'home', // Incluir persona si también es necesario
                            }
                        ],
                    },
                ]
            });

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
                    people: task.getPeople(),
                    children: await TaskController.mapChildren(task.children), // Espera el mapeo de hijos
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

        const schema = Joi.object({
            start_date: Joi.date().required()
        });
    
        const { error } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en TaskController->getTaskDate: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
        try {
            const personId = req.person.id;
            // Obtener solo las tareas principales (sin padre) directamente en la consulta
            const tasks = await Task.findAll({
                where: sequelize.where(
                    sequelize.fn('DATE', sequelize.col('Task.start_date')), // Convertir start_date a solo fecha
                    req.body.start_date // Comparar solo la parte de la fecha
                ),
                include: [
                    { model: Priority, as: 'priority' },
                    { model: Status, as: 'status' },
                    { model: Category, as: 'category' },
                    {
                        model: Task,
                        as: 'children',
                        include: [ // Incluye relaciones en las tareas hijas
                            { model: Priority, as: 'priority' },
                            { model: Status, as: 'status' },
                            { model: Category, as: 'category' },
                            {
                                model: HomePersonTask,
                                as: 'homePersonTasks',
                                where: { person_id: personId }, // Relación directa con la persona
                            },
                        ]
                    },
                    {
                        model: HomePersonTask,
                        as: 'homePersonTasks', 
                        where: { person_id: personId }, // Relación directa con la persona
                    },
                ]
            });

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
                    people: await TaskController.getPeopleForTask(task),
                    children: await TaskController.mapChildren(task.children) // Espera el mapeo de hijos
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
    
    // Método auxiliar para obtener las personas relacionadas con una tarea
    async getPeopleForTask(task) {
        // Obtener las personas relacionadas con la tarea desde la tabla homePersonTask
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
                },
                {
                    model: Home,
                    as: 'home',
                }
            ]
        });

        // Devolver las personas mapeadas
        return homePersonTasks.map(homePersonTask => ({
            id: homePersonTask.person.id,
            name: homePersonTask.person.name,
            image: homePersonTask.person.image,
            roleId: homePersonTask.role.id,
            roleName: homePersonTask.role.name
        }));
    },
    // Función recursiva para mapear subtareas
    async mapChildren(children) {
        try {
            return await Promise.all(children.map(async (child) => {
                    return {
                    id: child.id,
                    title: child.title,
                    description: child.description,
                    startDate: child.start_date,
                    endDate: child.end_date,
                    priorityId: child.priority_id,
                    colorPriority: child.priority?.color,
                    statusId: child.status_id,
                    categoryId: child.category_id,
                    nameCategory: child.category?.name,
                    iconCategory: child.category?.icon,
                    recurrence: child.recurrence,
                    estimatedTime: child.estimated_time,
                    comments: child.comments,
                    attachments: child.attachments,
                    geoLocation: child.geo_location,
                    parentId: child.parent_id,
                    // Personas relacionadas con la tarea hija
                    people: await TaskController.getPeopleForTask(child),
                    // Llama recursivamente a mapChildren para obtener hijos de este hijo
                    children: child.children ? await TaskController.mapChildren(child.children) : [],
                    
                };
            }));
        } catch (error) {
            logger.error('TaskController->mapChildren', error.message);
            throw new Error(error); // Manejo del error para debug
        }
    },

    async store(req, res) {
        logger.info(`${req.user.name} - Crea una nueva tarea`);
        logger.info('datos recibidos al crear una tarea');
        logger.info(JSON.stringify(req.body));
        const personId = req.person.id;
        // Validación de los datos de entrada usando Joi
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error(`Error de validación en TaskController->store: ${errorMsg}`);
            return res.status(400).json({ msg: errorMsg });
        }

        if (value.parent_id !== undefined && value.parent_id !== 0 && value.parent_id !== null) {
            parent = await Task.findByPk(value.parent_id);
            if (!parent) {
                logger.error(`TaskController->store: Tarea no encontrada con ID ${value.parent_id}`);
                return res.status(404).json({ msg: 'ParentNotFound' });
            }
        }

        // Verificar existencia de personas, roles y hogares antes de crear la tarea
        if (value.people && value.people.length > 0) {
            const personIds = value.people.map(person => person.person_id);
            const roleIds = value.people.map(person => person.role_id);
            const homeIds = value.people.map(person => person.home_id);

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

            const defaultHomeId = value.people?.[0]?.home_id || null; // Usar un home_id del array o null
            value.people = [
                ...(value.people || []),
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
            let filename = 'tasks/default.jpg'; // Imagen por defecto

            // Crear la tarea
            const task = await Task.create({
                title: value.title,
                description: value.description,
                start_date: value.start_date,
                end_date: value.end_date,
                priority_id: value.priority_id,
                status_id: value.status_id,
                category_id: value.category_id,
                recurrence: value.recurrence,
                estimated_time: value.estimated_time,
                comments: value.comments,
                attachments: filename,
                geo_location: value.geo_location,
                parent_id: value.parent_id
            }, { transaction: t });
                
            // Si se ha subido un archivo, procesarlo y actualizar la tarea
            if (req.file) {
                const extension = path.extname(req.file.originalname);
                const newFilename = `tasks/${task.id}${extension}`;
                
                // Ruta de archivo de origen y destino
                const oldPath = req.file.path;
                const newPath = path.join(__dirname, '..', '..', 'public', newFilename);
                try {
                    await fs.promises.rename(oldPath, newPath);
                    
                    // Actualizar el campo de attachments en la tarea
                    await task.update({ attachments: newFilename }, { transaction: t });
                    
                } catch (fileError) {
                    logger.error('Error al mover la imagen: ' + fileError.message);
                    throw new Error('Error al mover la imagen');
                }
            }
            
            // Llamada a ActivityLogService para registrar la creación
            await ActivityLogService.createActivityLog('Task', task.id, 'create', req.user.id, JSON.stringify(task));

            const associationsData = [];
            if (value.people && value.people.length > 0) {
                // Crear las asociaciones en paralelo
                for (const person of value.people) {
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
        const schema = Joi.object({
            id: Joi.number().required()
        });
    
        const { error } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en TaskController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
        
        try {
            const { id } = req.body;

            // Consulta la tarea por su ID con las relaciones requeridas
            const task = await Task.findOne({
                where: { id },
                include: [
                    {
                        association: 'children',
                        include: [
                            { association: 'priority' },
                            { association: 'status' },
                            { association: 'category' },
                            {
                                model: HomePersonTask,
                                as: 'homePersonTasks'
                            },
                        ]
                    },
                    { association: 'priority' },
                    { association: 'status' },
                    { association: 'category' },
                    {
                        model: HomePersonTask,
                        as: 'homePersonTasks',
                    },
                ]
            });

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
                people: await TaskController.getPeopleForTask(task),
                children: await TaskController.mapChildren(task.children)
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
        // Validación de los datos de entrada
        const { error, value } = schema.validate({ ...req.body });
        if (error) {
            logger.error(`Error de validación en TaskController->update: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

        if (value.parent_id !== undefined && value.parent_id !== 0 && value.parent_id !== null) {
            parent = await Task.findByPk(value.parent_id);
            if (!parent) {
                logger.error(`TaskController->store: Tarea no encontrada con ID ${value.parent_id}`);
                return res.status(404).json({ msg: 'ParentNotFound' });
            }
        }

        // Verificar existencia de personas, roles y hogares antes de crear la tarea
        if (value.people && value.people.length > 0) {
            const personIds = value.people.map(person => person.person_id);
            const roleIds = value.people.map(person => person.role_id);
            const homeIds = value.people.map(person => person.home_id);

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

                const defaultHomeId = value.people?.[0]?.home_id || null; // Usar un home_id del array o null
                value.people = [
                    ...(value.people || []),
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
            const task = await Task.findByPk(value.id);
    
            // Verificación de existencia
            if (!task) {
                return res.status(404).json({ msg: 'TaskNotFound' });
            }
    
            // Lista de campos permitidos para actualizar
            const fieldsToUpdate = [
                'title', 'description', 'priority_id', 'status_id', 'category_id', 
                'start_date', 'end_date', 'recurrence', 'estimated_time', 
                'comments', 'geo_location', 'parent_id'
            ];
    
            // Filtrar campos en req.body y construir el objeto updatedData
            const updatedData = Object.keys(req.body)
                .filter(key => fieldsToUpdate.includes(key) && req.body[key] !== undefined)
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});
    
            // Procesar la imagen si se sube una nueva
            if (req.file) {
                const extension = path.extname(req.file.originalname);
                const newFilename = `tasks/${task.id}${extension}`;
    
                // Eliminar la imagen anterior si no es la predeterminada
                if (task.attachments && task.attachments !== 'tasks/default.jpg') {
                    const oldIconPath = path.join(__dirname, '../../public', task.attachments);
                    try {
                        await fs.promises.unlink(oldIconPath);
                        logger.info(`Imagen anterior eliminada: ${oldIconPath}`);
                    } catch (error) {
                        logger.error(`Error al eliminar la imagen anterior: ${error.message}`);
                    }
                }
    
                // Mover el nuevo archivo a la carpeta pública
                const newPath = path.join(__dirname, '../../public', newFilename);
                await fs.promises.rename(req.file.path, newPath);
    
                // Guardar la nueva ruta de la imagen en updatedData
                updatedData.attachments = `${newFilename}`;
            }
            
            // Actualizar la tarea solo si hay datos para cambiar
            if (Object.keys(updatedData).length > 0) {
                await task.update(updatedData);
                logger.info(`Task actualizada exitosamente (ID: ${task.id})`);
            }
            let associationsData = [];
            // Sincronizar asociaciones
            if (value.people && value.people.length > 0) {
                const { toAdd, toUpdate, toDelete } = await TaskController.syncTaskPeople(value.id, value.people, t);
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
            res.status(200).json({ task });
        } catch (error) {
            await t.rollback();
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
    
            logger.error('TaskController->update: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async syncTaskPeople(taskId, peopleArray, transaction = null) {
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
    },
   

    async destroy(req, res) {
        logger.info(`${req.user.name} - Elimina tarea con ID ${req.body.id}`);
    
        // Validación de los datos con Joi
        const schema = Joi.object({
            id: Joi.number().required()
        });
    
        const { error } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en TaskController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
    
        const t = await sequelize.transaction();
        try {
            // Buscar la tarea por ID
            const task = await Task.findByPk(req.body.id);
    
            if (!task) {
                return res.status(404).json({ msg: 'TaskNotFound' });
            }
    
            // Eliminar archivos adjuntos si existen
            if (task.attachments  && task.attachments !== 'tasks/default.jpg') {
                const attachmentPath = path.join(__dirname, '../../public', task.attachments);
                try {
                    await fs.promises.unlink(attachmentPath);
                    logger.info(`Archivo adjunto eliminado: ${attachmentPath}`);
                } catch (error) {
                    logger.error(`Error al eliminar el archivo adjunto: ${error.message}`);
                }
            }
            // Llamada a ActivityLogService para registrar la creación
            await ActivityLogService.createActivityLog('Task', task.id, 'delete', req.user.id, JSON.stringify(task));
            // Eliminar la tarea
            await task.destroy({ transaction: t });
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

        const schema = Joi.object({
            home_id: Joi.number().required()
        });
    
        const { error, value } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en TaskController->category_status_priority: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

         // Verificar si el hogar existe
         const home = await Home.findByPk(value.home_id);
         if (!home) {
             logger.error(`WarehouseController->category_status_priority: Hogar no encontrado con ID ${home_id}`);
             return res.status(404).json({ msg: 'HomeNotFound' });
         }

         // Obtén el ID de la persona autenticada
         const personId = req.person.id;
        // Establecer el idioma de i18n dinámicamente
         if (!personId) {
             return res.status(404).json({ error: 'Persona no encontrada' });
         }
        try {
           const categories = await CategoryService.getCategories(personId, "Task");//const categories = await TaskController.getCategories(personId);
           const statuses = await StatusService.getStatus("Task");
           const priorities = await TaskController.getPriorities();
           const people = await TaskController.getPeople(value.home_id);//await TaskController.getPeople(value.home_id);
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
            const priorities = await Priority.findAll(); // Obtén todas las prioridades
    
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
