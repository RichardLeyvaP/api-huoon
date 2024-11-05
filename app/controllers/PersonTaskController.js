const Joi = require('joi');
const { PersonTask, Person, Task, Role, sequelize } = require('../models');
const logger = require('../../config/logger');

// Esquema de validación para PersonTask
const schema = Joi.object({
    person_id: Joi.number().required(),
    task_id: Joi.number().required(),
    role_id: Joi.number().optional(),
    id: Joi.number().optional(),
});

const assignPeopleSchema = Joi.object({
    task_id: Joi.number().required(),
    people: Joi.array().items(
        Joi.object({
            person_id: Joi.number().required(),
            role_id: Joi.number().required()
        })
    ).required()
});

const PersonTaskController = {
    // Obtener todas las relaciones Person-Task
    async index(req, res) {
        logger.info(`${req.user.name} - Consulta todas las relaciones Person-Task`);
        try {
            const personTasks = await PersonTask.findAll({
                include: [
                    { model: Person, as: 'person' },
                    { model: Task, as: 'task' },
                    { model: Role, as: 'role' }
                ]
            });

            const mappedPersonTasks = personTasks.map(personTask => ({
                id: personTask.id,
                personId: personTask.person.id,
                personName: personTask.person.name,
                taskId: personTask.task.id,
                taskName: personTask.task.name,
                roleId: personTask.role?.id,
                roleName: personTask.role?.name
            }));

            res.status(200).json({ personTasks: mappedPersonTasks });
        } catch (error) {
            logger.error(`PersonTaskController->index: ${error.message}`);
            res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },

    // Crear una nueva relación Person-Task
    async store(req, res) {
        logger.info(`${req.user.name} - Crea una nueva relación Person-Task`);

        const { error, value } = schema.validate(req.body);
        if (error) {
            logger.error(`PersonTaskController->store - Error de validación: ${error.details.map(e => e.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

        try {
            const personTask = await PersonTask.create(value);
            res.status(201).json({ msg: 'PersonTaskCreated', personTask });
        } catch (error) {
            logger.error(`PersonTaskController->store: ${error.message}`);
            res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },

    // Obtener una relación específica Person-Task por ID
    async show(req, res) {
        logger.info(`${req.user.name} - Busca la relación Person-Task con ID: ${req.body.id}`);
        
        // Validación de los datos con Joi
        const schema = Joi.object({
            id: Joi.number().required()
        });

        const { error } = schema.validate({ id: req.body.id });
        if (error) {
            logger.error(`PersonTaskController->show - Error de validación: ${error.details.map(e => e.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const personTask = await PersonTask.findByPk(req.body.id, {
                include: [
                    { model: Person, as: 'person' },
                    { model: Task, as: 'task' },
                    { model: Role, as: 'role' }
                ]
            });
            if (!personTask) return res.status(404).json({ msg: 'PersonTaskNotFound' });

            const mappedPersonTask = {
                id: personTask.id,
                personId: personTask.person.id,
                personName: personTask.person.name,
                taskId: personTask.task.id,
                taskName: personTask.task.name,
                roleId: personTask.role?.id,
                roleName: personTask.role?.name
            };

            res.status(200).json({ personTask: mappedPersonTask });
        } catch (error) {
            logger.error(`PersonTaskController->show: ${error.message}`);
            res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },

    // Actualizar una relación Person-Task
    async update(req, res) {
        logger.info(`${req.user.name} - Actualiza una relación Person-Task`);

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`PersonTaskController->update - Error de validación: ${error.details.map(e => e.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const personTask = await PersonTask.findByPk(req.body.id);
            if (!personTask) return res.status(404).json({ msg: 'PersonTaskNotFound' });

            await personTask.update(req.body);
            res.status(200).json({ msg: 'PersonTaskUpdated', personTask });
        } catch (error) {
            logger.error(`PersonTaskController->update: ${error.message}`);
            res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },

    // Eliminar una relación Person-Task
    async destroy(req, res) {
        logger.info(`${req.user.name} - Elimina una relación Person-Task`);
        // Validación de los datos con Joi
        const schema = Joi.object({
            id: Joi.number().required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`PersonTaskController->destroy - Error de validación: ${error.details.map(e => e.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const personTask = await PersonTask.findByPk(req.body.id);
            if (!personTask) return res.status(404).json({ msg: 'PersonTaskNotFound' });

            await personTask.destroy();
            res.status(200).json({ msg: 'PersonTaskDeleted' });
        } catch (error) {
            logger.error(`PersonTaskController->destroy: ${error.message}`);
            res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },

    async assignPeopleToTask(req, res) {
        // Validar los datos de entrada con Joi
        const { error, value } = assignPeopleSchema.validate(req.body);
        
        if (error) {
            logger.error(`Error de validación en assignPeopleToHome: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

        const { task_id, people } = value; // Extraer valores validados

        try {
            const home = await Task.findByPk(task_id);
            if (!home) {
                logger.error(`assignPeopleToTask: No se encontró un hogar con ID ${task_id}`);
                return res.status(404).json({ error: 'TaskNotFound' });
            }

            // Crear o actualizar las relaciones en la tabla pivote
            const associations = people.map(async (person) => {
                const { person_id, role_id } = person;

                // Verificar si la persona existe
                const personInstance = await Person.findByPk(person_id);
                if (!personInstance) {
                    logger.error(`assignPeopleToHome: No se encontró una persona con ID ${person_id}`);
                    return res.status(404).json({ error: `PersonNotFound: ID ${person_id}` });
                }

                // Verificar si la persona existe
                const roleInstance = await Role.findByPk(role_id);
                if (!roleInstance) {
                    logger.error(`assignPeopleToHome: No se encontró un rol con ID ${role_id}`);
                    return res.status(404).json({ error: `PersonNotFound: ID ${role_id}` });
                }

                // Crear o actualizar la asociación en la tabla pivote
                await HomePerson.upsert({
                    home_id: home_id,
                    person_id: person_id,
                    role_id: role_id,
                });
            });

            // Ejecutar las asociaciones en paralelo y capturar resultados
        const results = await Promise.allSettled(associations);

        // Filtrar errores si alguno falló
        const errors = results
            .filter(result => result.status === 'rejected' || result.value?.error)
            .map(result => result.reason || result.value.error);

        if (errors.length) {
            logger.error(`PersonTaskController->store - Algunos errores ocurrieron: ${errors.join(', ')}`);
            return res.status(400).json({ msg: errors });
        }

            res.status(200).json({ msg: 'PeopleAssignedToHome' });
        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            logger.error('HomePersonController->assignPeopleToHome: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
};

module.exports = PersonTaskController;
