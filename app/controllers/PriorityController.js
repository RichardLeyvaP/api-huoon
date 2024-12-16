const logger = require('../../config/logger'); // Importa el logger
const { PriorityRepository } = require('../repositories');

const PriorityController = {
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar las prioridades`);

        try {
            const priorities = await PriorityRepository.findAll();

            if (!priorities.length) {
                return res.status(204).json({ msg: 'PriorityNotFound' });
            }

            res.status(200).json({ 'priorities': priorities });
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
            const priority = await PriorityRepository.findById(req.body.id);

            if (!priority) {
                return res.status(404).json({ msg: 'PriorityNotFound' });
            }

            res.status(200).json({ 'priority': priority });
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

        try {
            const priority = await PriorityRepository.create(req.body);
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

        try {
            const priority = await PriorityRepository.findById(req.body.id);
            if (!priority) {
                logger.error(`PriorityController->update: Prioridad no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'PriorityNotFound' });
            }

            const priorityUpdate = await PriorityRepository.update(priority, req.body);

            res.status(200).json({ msg: 'PriorityUpdated', priorityUpdate });
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

        try {
            const priority = await PriorityRepository.findById(req.body.id);
            if (!priority) {
                logger.error(`PriorityController->destroy: Prioridad no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'PriorityNotFound' });
            }
            
            logger.info(`Prioridad eliminada exitosamente: ${priority.name} (ID: ${priority.id})`);
            const priorityDelete = await PriorityRepository.delete(priority);

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
