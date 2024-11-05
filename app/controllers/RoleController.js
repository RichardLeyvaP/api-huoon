const Joi = require('joi');
const { Role } = require('../models');  // Importar el modelo Role
const logger = require('../../config/logger'); // Importa el logger
const ActivityLogService = require('../services/ActivityLogService');

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

        // Validación de datos
        const schema = Joi.object({
            name: Joi.string().required(),               // Obligatorio
            description: Joi.string().optional().allow(null, ''), // Opcional, permite null o vacío
            type: Joi.string().optional().allow(null, '') // Opcional, permite null o vacío
        });

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en RolesController->store: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const role = await Role.create({
                name: req.body.name,
                description: req.body.description,
                type: req.body.type || "Sistema"
            });
            // Llamada a ActivityLogService para registrar la creación
            await ActivityLogService.createActivityLog('Role', role.id, 'create', req.user.id, JSON.stringify(role));
            res.status(201).json({ msg: 'RoleCreated', role });
        } catch (error) {
            logger.error('Error en RoleController->store: ' + error.message);
            res.status(500).json({ error: 'ServerError' });
        }
    },

    // Mostrar un rol específico
    async show(req, res) {
        logger.info(`${req.user.name} - Accediendo a un rol específico`);

        // Validación del ID
        const schema = Joi.object({
            id: Joi.number().required()
        });

        const { error } = schema.validate(req.params);
        if (error) {
            logger.error(`Error de validación en RolesController->show: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const role = await Role.findByPk(req.params.id);
            if (!role) {
                return res.status(404).json({ msg: 'RoleNotFound' });
            }

            res.status(200).json({ role });
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

        // Validación de los datos
        const schema = Joi.object({
            id: Joi.number().required(),
            name: Joi.string().optional(),
            description: Joi.string().optional().allow(null),
            type: Joi.string().optional().allow(null)
        });

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en RolesController->update: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const role = await Role.findByPk(req.body.id);
            if (!role) {
                return res.status(404).json({ msg: 'RoleNotFound' });
            }

            const fieldsToUpdate = ['name', 'description'];
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

        // Validación del ID
        const schema = Joi.object({
            id: Joi.number().required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en RolesController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

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
