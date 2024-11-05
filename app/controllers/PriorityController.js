const Joi = require('joi');
const { Priority } = require('../models'); // Importar el modelo Priority
const logger = require('../../config/logger'); // Importa el logger

const PriorityController = {
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar las prioridades`);

        try {
            const priorities = await Priority.findAll();

            if (!priorities.length) {
                return res.status(204).json({ msg: 'PriorityNotFound' });
            }

            res.status(200).json({ priorities });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('PriorityController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async show(req, res) {
        const priorityId = req.body.id;
        logger.info(`${req.user.name} - Entra a buscar la prioridad con ID: ${priorityId}`);

        try {
            const priority = await Priority.findOne({ where: { id: priorityId } });

            if (!priority) {
                return res.status(404).json({ msg: 'PriorityNotFound' });
            }

            res.status(200).json({ priority });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('PriorityController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async store(req, res) {
        logger.info(`${req.user.name} - Crea una nueva prioridad`);

        const schema = Joi.object({
            name: Joi.string().max(255).required(),
            level: Joi.number().integer().required(),
            color: Joi.string().required(),
            description: Joi.string().allow(null, '')
        });

        const { error, value } = schema.validate(req.body);

        if (error) {
            logger.error(`Error de validación en PriorityController->store: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

        try {
            const priority = await Priority.create(value);
            return res.status(201).json({ msg: 'PriorityStoreOk', priority });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('PriorityController->store: ' + errorMsg);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async update(req, res) {
        logger.info(`${req.user.name} - Editando una prioridad`);

        const schema = Joi.object({
            id: Joi.number().required(),
            name: Joi.string().max(255).optional(),
            level: Joi.number().integer().optional(),
            color: Joi.string().optional(),
            description: Joi.string().allow(null).optional()
        });

        const { error } = schema.validate(req.body);

        if (error) {
            logger.error(`Error de validación en PriorityController->update: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const priority = await Priority.findByPk(req.body.id);
            if (!priority) {
                logger.error(`PriorityController->update: Prioridad no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'PriorityNotFound' });
            }

            const fieldsToUpdate = ['name', 'level', 'color', 'description'];

            const updatedData = Object.keys(req.body)
                .filter(key => fieldsToUpdate.includes(key) && req.body[key] !== undefined)
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});

            if (Object.keys(updatedData).length > 0) {
                await priority.update(updatedData);
                logger.info(`Prioridad actualizada exitosamente: ${priority.name} (ID: ${priority.id})`);
            }

            res.status(200).json({ msg: 'PriorityUpdated', priority });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error(`PriorityController->update: Error al actualizar la prioridad: ${errorMsg}`);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando una prioridad`);

        const schema = Joi.object({
            id: Joi.number().required()
        });

        const { error } = schema.validate(req.body);

        if (error) {
            logger.error(`Error de validación en PriorityController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const priority = await Priority.findByPk(req.body.id);
            if (!priority) {
                logger.error(`PriorityController->destroy: Prioridad no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'PriorityNotFound' });
            }

            await priority.destroy();
            logger.info(`Prioridad eliminada exitosamente: ${priority.name} (ID: ${priority.id})`);

            res.status(200).json({ msg: 'PriorityDeleted' });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error(`PriorityController->destroy: Error al eliminar la prioridad: ${errorMsg}`);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }
};

module.exports = PriorityController;
