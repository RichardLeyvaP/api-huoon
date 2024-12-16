const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Task, Priority, Status, Category, Person, HomePersonTask, Role, Home, HomePerson, sequelize } = require('../models');  // Importar el modelo Home
const logger = require('../../config/logger'); // Importa el logger

class TaskRepository {
    async findAll() {
        return await Task.findAll({
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
    }

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
                    people: this.peopleTask(child) || [],
                    // Llama recursivamente a mapChildren para obtener hijos de este hijo
                    children: child.children ? this.mapChildren(child.children) : [],
                    
                };
            }));
        } catch (error) {
            logger.error('TaskRepository->mapChildren', error.message);
            throw error; // Manejo del error para debug
        }
      }

    async findById(id) {
        return await Task.findByPk(id, {
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
            ],
        });
    }

    async findAllDate(start_date, personId) {
        return await Task.findAll({
            where: sequelize.where(
                sequelize.fn('DATE', sequelize.col('Task.start_date')), // Convertir start_date a solo fecha
                start_date // Comparar solo la parte de la fecha
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
                 // Filtrar tareas relacionadas con una persona específica
        {
            model: HomePersonTask,
            as: 'homePersonTasks', 
            where: { person_id: personId }, // Filtro para recuperar tareas relacionadas con la persona
                },
            ]
        });
    }

    async peopleTask(task){
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
    }

    async create(body, file, t) {
    
        try {
         // Crear la tarea
         const task = await Task.create({
            title: body.title,
            description: body.description,
            start_date: body.start_date,
            end_date: body.end_date,
            priority_id: body.priority_id,
            status_id: body.status_id,
            category_id: body.category_id,
            recurrence: body.recurrence,
            estimated_time: body.estimated_time,
            comments: body.comments,
            attachments: 'tasks/default.jpg',
            geo_location: body.geo_location,
            parent_id: body.parent_id
        }, { transaction: t });
            
        // Si se ha subido un archivo, procesarlo y actualizar la tarea
        if (file) {
            const extension = path.extname(file.originalname);
            const newFilename = `tasks/${task.id}${extension}`;
            
            // Ruta de archivo de origen y destino
            const oldPath = file.path;
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
        return task;
    } catch (err) {
        logger.error(`Error en TaskRepository->store: ${err.message}`);
        throw err; // Propagar el error para que el rollback se ejecute
    }
    }

    async update(task, body, file, t) {
        // Lista de campos permitidos para actualizar
        const fieldsToUpdate = [
            'title', 'description', 'priority_id', 'status_id', 'category_id', 
            'start_date', 'end_date', 'recurrence', 'estimated_time', 
            'comments', 'geo_location', 'parent_id'
        ];
        try{

        // Filtrar campos en req.body y construir el objeto updatedData
        const updatedData = Object.keys(body)
            .filter(key => fieldsToUpdate.includes(key) && body[key] !== undefined)
            .reduce((obj, key) => {
                obj[key] = body[key];
                return obj;
            }, {});

        // Procesar la imagen si se sube una nueva
        if (file) {
            const extension = path.extname(file.originalname);
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
            await task.update(updatedData, {transaction: t});
            logger.info(`Task actualizada exitosamente (ID: ${task.id})`);
        }

        return updatedData;
    } catch (err) {
        logger.error(`Error en TaskRepository->update: ${err.message}`);
        throw err; // Propagar el error para que el rollback se ejecute
    }
    }

    async delete(task, t) {
        if (task.image && task.image !== 'tasks/default.jpg') {
            const imagePath = path.join(__dirname, '../../public', task.image);
            await fs.promises.unlink(imagePath).catch(err => logger.error(`Error eliminando la imagen: ${err.message}`));
          }
      
          return await task.destroy({transaction: t});
    }

    async syncTaskPeople(taskId, peopleArray, t) {
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
                transaction: t
            });
            actions.push({ action: 'deleted', ids: toDelete });
        }
    
        if (toUpdate.length > 0) {
            for (const update of toUpdate) {
                await HomePersonTask.update(
                    { role_id: update.role_id },
                    { where: { id: update.id }, transaction: t }
                );
            }
            actions.push({ action: 'updated', ids: toUpdate.map(u => u.id) });
        }
    
        if (toAdd.length > 0) {
            await HomePersonTask.bulkCreate(toAdd, { transaction: t });
            actions.push({ action: 'added', ids: toAdd.map(a => a.id) });
        }
    
        // Devolver detalles de las operaciones realizadas
        return { toAdd, toUpdate, toDelete, actions };
    }
}

module.exports = new TaskRepository();
