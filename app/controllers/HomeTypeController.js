const Joi = require('joi');
const { HomeType, sequelize } = require('../models'); // Importar el modelo HomeType
const logger = require('../../config/logger'); // Importa el logger
const i18n = require('../../config/i18n-config');

// Esquema de validación de Joi
const schema = Joi.object({
    name: Joi.string().max(255).optional(),
    description: Joi.string().allow(null, ''),
    icon: Joi.string().allow(null, ''),
    id: Joi.number().optional(),
});

const HomeTypeController = {
    // Obtener todos los tipos de hogar
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar los tipos de hogar`);

        try {
            const homeTypes = await HomeType.findAll();
            const homeTypesMap = homeTypes.map(homeType => {
                return{
                    id: homeType.id,
                    name: i18n.__(`homeType.${homeType.name}.name`),
                    description: i18n.__(`homeType.${homeType.name}.description`),
                    icon: homeType.icon
                }
            });
            res.status(200).json({ 'homeTypes': homeTypesMap });
        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';

        logger.error('HomeTypeController->index: ' + errorMsg);
        res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Crear un nuevo tipo de hogar
    async store(req, res) {
        logger.info(`${req.user.name} - Crea un nuevo tipo de hogar`);

        const { error, value } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en HomeTypeController->store: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

        try {
            const homeType = await HomeType.create(value);
            res.status(201).json({ msg: 'HomeTypeCreated', homeType });
        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';

        logger.error('HomeTypeController->store: ' + errorMsg);
        res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Obtener un tipo de hogar por ID
    async show(req, res) {
        logger.info(`${req.user.name} - Entra a buscar el tipo de hogar con ID: ${req.body.id}`);

        try {
            const homeType = await HomeType.findByPk(req.body.id);
            if (!homeType) {
                return res.status(404).json({ msg: 'HomeTypeNotFound' });
            }
            res.status(200).json({ 'homeTypes': [homeType] });
        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';

        logger.error('HomeTypeController->show: ' + errorMsg);
        res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Actualizar un tipo de hogar
    async update(req, res) {
        logger.info(`${req.user.name} - Editando un tipo de hogar`);

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en HomeTypeController->update: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const homeType = await HomeType.findByPk(req.body.id);
            if (!homeType) {
                logger.error(`HomeTypeController->update: Tipo de hogar no encontrado con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'HomeTypeNotFound' });
            }

            // Filtra solo los campos que están presentes en el cuerpo de la solicitud
            const updatedFields = Object.keys(req.body).reduce((acc, key) => {
                if (key !== 'id' && req.body[key] !== undefined) {
                    acc[key] = req.body[key];
                }
                return acc;
            }, {});

            await homeType.update(updatedFields);

            res.status(200).json({ msg: 'HomeTypeUpdated', homeType });

        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';

        logger.error('HomeTypeController->update: ' + errorMsg);
        res.status(500).json({ error: 'ServerError', details: errorMsg });;
        }
    },

    // Eliminar un tipo de hogar
    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando un tipo de hogar`);

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en HomeTypeController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const homeType = await HomeType.findByPk(req.body.id);
            if (!homeType) {
                logger.error(`HomeTypeController->destroy: Tipo de hogar no encontrado con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'HomeTypeNotFound' });
            }

            await homeType.destroy();
            res.status(200).json({ msg: 'HomeTypeDeleted' });

        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';

        logger.error('HomeTypeController->destroy: ' + errorMsg);
        res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }
};

module.exports = HomeTypeController;
