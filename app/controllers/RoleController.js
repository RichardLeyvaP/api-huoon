const logger = require('../../config/logger'); // Importa el logger
const { RoleRepository } = require('../repositories');

module.exports = {
    // Listar roles
    async index(req, res) {
        logger.info(`${req.user.name} - Accediendo a la lista de roles`);

        try {
            const roles = await RoleRepository.findAll();

            res.status(200).json({ 'roles': roles });
        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error('Error en RoleController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Crear un nuevo rol
    async store(req, res) {
        logger.info(`${req.user.name} - Creando un nuevo rol`);

        try {
            const role = await RoleRepository.create(req.body);
            res.status(201).json({ msg: 'RoleCreated', role });
        } catch (error) {
            logger.error('Error en RoleController->store: ' + error.message);
            res.status(500).json({ error: 'ServerError' });
        }
    },

    // Mostrar un rol específico
    async show(req, res) {
        logger.info(`${req.user.name} - Accediendo a un rol específico`);

        try {
            const role = await RoleRepository.findById(req.body.id);
            if (!role) {
                return res.status(400).json({ msg: 'RoleNotFound' });
            }

            res.status(200).json({ 'role': role });
        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error('RoleController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Actualizar un rol
    async update(req, res) {
        logger.info(`${req.user.name} - Editando un rol`);

        try {
            const role = await RoleRepository.findById(req.body.id);
            if (!role) {
                return res.status(400).json({ msg: 'RoleNotFound' });
            }

            const roleUpdate = await RoleRepository.update(Role, req.bpdy);
            
            res.status(200).json({ msg: 'RoleUpdated', roleUpdate });
        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error(`RoleController->update: Error al actualizar el rol: ${errorMsg}`);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Eliminar un rol
    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando un rol`);

        try {
            const role = await RoleRepository.findById(req.body.id);
            if (!role) {
                return res.status(400).json({ msg: 'RoleNotFound' });
            }

            const roleDelete = await RoleRepository.delete(role);
            res.status(200).json({ msg: 'RoleDeleted' });
        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error(`RoleController->destroy: Error al eliminar el rol: ${errorMsg}`);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }
};
