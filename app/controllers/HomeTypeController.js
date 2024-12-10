const { HomeType, sequelize } = require('../models'); // Importar el modelo HomeType
const logger = require('../../config/logger'); // Importa el logger
const i18n = require('../../config/i18n-config');

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

        const { name, description, icon } = req.body;

        try {
            const homeType = await HomeType.create({
                name: name,
                description: description,
                icon: icon,
            });
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

        try {
            const homeType = await HomeType.findByPk(req.body.id);
            if (!homeType) {
                logger.error(`HomeTypeController->update: Tipo de hogar no encontrado con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'HomeTypeNotFound' });
            }

            const fieldsToUpdate = ['name', 'icon', 'description'];

            const updatedData = Object.keys(req.body)
                .filter(key => fieldsToUpdate.includes(key) && req.body[key] !== undefined)
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});

            if (Object.keys(updatedData).length > 0) {
                await homeType.update(updatedData);
                logger.info(`Tipo de hogar actualizado exitosamente: ${homeType.name} (ID: ${homeType.id})`);
            }

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
