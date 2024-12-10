const { Role } = require('../models');  // Importar el modelo Role
const logger = require('../../config/logger'); // Importa el logger

module.exports = {
    // Listar roles
    async index(req, res) {
        logger.info(`${req.user.name} - Accediendo a la lista de roles`);

        try {
            const roles = await Role.findAll({
                attributes: ['name', 'description'], // Seleccionar solo los campos necesarios
            });

            res.status(200).json({ roles });
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

        const { name, description, type } = req.body;

        try {
            const role = await Role.create({
                name: name,
                description: description,
                type: type || "Sistema"
            });
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
            const role = await Role.findByPk(req.body.id);
            if (!role) {
                return res.status(404).json({ msg: 'RoleNotFound' });
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
            const role = await Role.findByPk(req.body.id);
            if (!role) {
                return res.status(404).json({ msg: 'RoleNotFound' });
            }

            const fieldsToUpdate = ['name', 'description', 'type'];
            const updatedData = {};

            fieldsToUpdate.forEach(field => {
                if (req.body[field] !== undefined) {
                    updatedData[field] = req.body[field];
                }
            });

            if (Object.keys(updatedData).length > 0) {
                await role.update(updatedData);
            }
            
            res.status(200).json({ msg: 'RoleUpdated', role });
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
            const role = await Role.findByPk(req.body.id);
            if (!role) {
                return res.status(404).json({ msg: 'RoleNotFound' });
            }

            await role.destroy();
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
