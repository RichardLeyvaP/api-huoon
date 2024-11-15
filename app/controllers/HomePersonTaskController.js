const Joi = require('joi');
const { HomePersonTask, Person, Task, Role, Home, sequelize } = require('../models');
const logger = require('../../config/logger');
const ActivityLogService = require('../services/ActivityLogService');

// Esquema de validación para PersonTask
const schema = Joi.object({
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
});

const HomePersonTaskController = {
    // Obtener todas las relaciones Person-Task
    async index(req, res) {
        logger.info(`${req.user.name} - Consulta todas las relaciones Home-Person-Task`);
        try {
            const personTasks = await HomePersonTask.findAll({
                include: [
                    { model: Person, as: 'person' },
                    { model: Task, as: 'task' },
                    { model: Home, as: 'home' },
                    { model: Role, as: 'role' }
                ]
            });

            const mappedHomePersonTasks = personTasks.map(homePersonTask => ({
                id: homePersonTask.id,
                personId: homePersonTask.person.id,
                personName: homePersonTask.person.name,
                homeId: homePersonTask.home.id,
                homeName: homePersonTask.home.name,
                taskId: homePersonTask.task.id,
                taskName: homePersonTask.task.title,
                roleId: homePersonTask.role?.id,
                roleName: homePersonTask.role?.name
            }));

            res.status(200).json({ homePersonTasks: mappedHomePersonTasks });
        } catch (error) {
            logger.error(`HomeHomePersonTaskController->index: ${error.message}`);
            res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },

    // Crear una nueva relación Person-Task
    async store(req, res) {
        logger.info(`${req.user.name} - Crea una nueva relación Home-Person-Task`);

        const { error, value } = schema.validate(req.body);
        if (error) {
            logger.error(`HomePersonTaskController->store - Error de validación: ${error.details.map(e => e.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

        try {
            const homePersonTask = await HomePersonTask.create(value);
            res.status(201).json({ msg: 'HomePersonTaskCreated', homePersonTask });
        } catch (error) {
            logger.error(`HomeHomePersonTaskController->store: ${error.message}`);
            res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },

    // Obtener una relación específica Person-Task por ID
    async show(req, res) {
        logger.info(`${req.user.name} - Busca la relación Home-Person-Task con ID: ${req.body.id}`);
        
        // Validación de los datos con Joi
        const schema = Joi.object({
            id: Joi.number().required()
        });

        const { error } = schema.validate({ id: req.body.id });
        if (error) {
            logger.error(`HomePersonTaskController->show - Error de validación: ${error.details.map(e => e.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const homePersonTask = await HomePersonTask.findByPk(req.body.id, {
                include: [
                    { model: Person, as: 'person' },
                    { model: Task, as: 'task' },
                    { model: Role, as: 'role' },
                    { model: Home, as: 'home' }
                ]
            });
            if (!homePersonTask) return res.status(404).json({ msg: 'HomePersonTaskNotFound' });

            const mappedHomePersonTask = {
                id: homePersonTask.id,
                personId: homePersonTask.person.id,
                personName: homePersonTask.person.name,
                taskId: homePersonTask.task.id,
                taskName: homePersonTask.task.name,
                roleId: homePersonTask.role?.id,
                roleName: homePersonTask.role?.name
            };

            res.status(200).json({ homePersonTask: mappedHomePersonTask });
        } catch (error) {
            logger.error(`HomePersonTaskController->show: ${error.message}`);
            res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },

    // Actualizar una relación Person-Task
    async update(req, res) {
        logger.info(`${req.user.name} - Actualiza una relación Home-Person-Task`);

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`HomePersonTaskController->update - Error de validación: ${error.details.map(e => e.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const homepersonTask = await HomePersonTask.findByPk(req.body.id);
            if (!homepersonTask) return res.status(404).json({ msg: 'HomePersonTaskNotFound' });

            await homepersonTask.update(req.body);
            res.status(200).json({ msg: 'HomePersonTaskUpdated', homepersonTask });
        } catch (error) {
            logger.error(`HomePersonTaskController->update: ${error.message}`);
            res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },

    // Eliminar una relación Person-Task
    async destroy(req, res) {
        logger.info(`${req.user.name} - Elimina una relación Home-Person-Task`);
        // Validación de los datos con Joi
        const schema = Joi.object({
            id: Joi.number().required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`HomePersonTaskController->destroy - Error de validación: ${error.details.map(e => e.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const homepersonTask = await HomePersonTask.findByPk(req.body.id);
            if (!homepersonTask) return res.status(404).json({ msg: 'PersonTaskNotFound' });

            await homepersonTask.destroy();
            res.status(200).json({ msg: 'HomePersonTaskDeleted' });
        } catch (error) {
            logger.error(`HomePersonTaskController->destroy: ${error.message}`);
            res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },

    async assignPeopleToTask(req, res) {
        // Validar los datos de entrada con Joi
        const { error, value } = assignPeopleSchema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en assignPeopleToTask: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }
    
        const { task_id, people } = value; // Extraer valores validados
    
        // Iniciar transacción
        const t = await sequelize.transaction();
    
        try {
            // Buscar la tarea
            const task = await Task.findByPk(task_id);
            if (!task) {
                logger.error(`assignPeopleToTask: No se encontró una tarea con ID ${task_id}`);
                return res.status(404).json({ error: 'TaskNotFound' });
            }
    
            // Obtener todos los IDs de las personas, roles y hogares para consultas paralelas
            const personIds = people.map(person => person.person_id);
            const roleIds = people.map(person => person.role_id);
            const homeIds = people.map(person => person.home_id);
    
            // Consultas paralelas para verificar la existencia de las personas, roles y hogares
            const [persons, roles, homes] = await Promise.all([
                Person.findAll({ where: { id: personIds } }),
                Role.findAll({ where: { id: roleIds } }),
                Home.findAll({ where: { id: homeIds } }),
            ]);
    
            // Mapear los resultados a un objeto para validación rápida
            const personMap = new Map(persons.map(person => [person.id, person]));
            const roleMap = new Map(roles.map(role => [role.id, role]));
            const homeMap = new Map(homes.map(home => [home.id, home]));
    
            // Acumular los errores
            const errors = [];
            const associations = [];
            const associationsData = [];  // Para el log de actividades
    
            // Validar y preparar las asociaciones
            for (const person of people) {
                const { person_id, role_id, home_id } = person;
    
                // Verificar existencia de la persona, rol y hogar
                const personInstance = personMap.get(person_id);
                const roleInstance = roleMap.get(role_id);
                const homeInstance = homeMap.get(home_id);
    
                if (!personInstance || !roleInstance || !homeInstance) {
                    errors.push(`Falta asociación para persona ${person_id}, rol ${role_id}, o hogar ${home_id}`);
                    continue;
                }
    
                // Crear la asociación en la base de datos (se agregan a un array para bulkCreate)
                associations.push({
                    task_id: task.id,
                    person_id,
                    role_id,
                    home_id
                });
    
                // Acumular la información de la asociación para el log de actividades
                associationsData.push({
                    person_id,
                    role_id,
                    home_id
                });
            }
    
            // Si hubo errores, hacer rollback y devolver respuesta
            if (errors.length) {
                logger.error(`assignPeopleToTask - Errores: ${errors.join(', ')}`);
                await t.rollback();
                return res.status(400).json({ msg: errors });
            }
    
            // Realizar bulkCreate solo si no hubo errores
            await HomePersonTask.bulkCreate(associations, {
                updateOnDuplicate: ['role_id', 'home_id'], // Actualizar si ya existe (no es necesario 'updatedAt' aquí)
                transaction: t,
            });
    
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
    
            // Confirmar transacción
            await t.commit();
            res.status(200).json({ msg: 'PeopleAssignedToTask' });
    
        } catch (error) {
            // Si algo falla, hacer rollback y loguear el error
            await t.rollback();
            const errorMsg = error.message || 'Error desconocido';
            logger.error('assignPeopleToTask: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
};

module.exports = HomePersonTaskController;
