// controllers/WarehouseController.js
const Joi = require('joi');
const { Warehouse } = require('../models');
const logger = require('../../config/logger');

const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    location: Joi.string().allow(null, ''),
    status: Joi.number().integer().valid(0, 1).default(0),
    id: Joi.number().optional(),
});


const WarehouseController =  {
    // Listar todos los almacenes
    async index(req, res) {
        logger.info(`${req.user.name} - 'Entra abuscar los almacenes'`);
        try {
            const warehouses = await Warehouse.findAll({
                attributes: ['id', 'title', 'description', 'location', 'status']
            });
            res.status(200).json({ warehouses: warehouses });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Crear un nuevo almacén
    async store(req, res) {
        logger.info(`${req.user.name} - Crea un nuevo almacén`);
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en WarehouseController->store: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }

        try {
            const warehouse = await Warehouse.create({
                title: value.title,
                description: value.description,
                location: value.location,
                status: value.status
            });
            res.status(201).json({ warehouse });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->store: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Ver detalles de un almacén específico
    async show(req, res) {
        logger.info(`${req.user.name} - Entra a buscar un almacén`);
         // Validación de los datos con Joi
         const schema = Joi.object({
            id: Joi.number().required()
        });
    
        const { error } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en WareHouseController->show: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
        try {
            const warehouse = await Warehouse.findByPk(req.body.id, {
                attributes: ['id', 'title', 'description', 'location', 'status']
            });

            if (!warehouse) {
                return res.status(404).json({ error: 'NotFoundError', details: 'Warehouse not found' });
            }
            res.status(200).json({ warehouses:warehouse });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Actualizar un almacén
    async update(req, res) {
        logger.info(`${req.user.name} - Edita un almacén`);
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en WarehouseController->update: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }

        try {
            const warehouse = await Warehouse.findByPk(req.body.id);
            if (!warehouse) {
                return res.status(404).json({ error: 'NotFoundError', details: 'Warehouse not found' });
            }

            const fieldsToUpdate = ['title', 'description', 'location', 'status'];

            const updatedData = Object.keys(req.body)
                .filter(key => fieldsToUpdate.includes(key) && req.body[key] !== undefined)
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});

                 // Actualizar solo si hay datos que cambiar
            if (Object.keys(updatedData).length > 0) {
                await warehouse.update(updatedData);
            }
            res.status(200).json({ warehouse });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->update: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Eliminar un almacén
    async destroy(req, res) {
        logger.info(`${req.user.name} - Elimina un almacén`);

        const schema = Joi.object({
            id: Joi.number().required()
        });

        const { error } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en WareHouseController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const warehouse = await Warehouse.findByPk(req.body.id);
            if (!warehouse) {
                return res.status(404).json({ error: 'NotFoundError', details: 'Warehouse not found' });
            }

            await warehouse.destroy();
            res.status(200).json({ message: 'Warehouse deleted successfully' });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->destroy: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }
}
module.exports = WarehouseController;
