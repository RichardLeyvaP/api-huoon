// controllers/WarehouseController.js
const Joi = require('joi');
const { Warehouse } = require('../models');
const logger = require('../../config/logger');

const WarehouseController =  {
    // Listar todos los almacenes
    async index(req, res) {
        try {
            const warehouses = await Warehouse.findAll({
                attributes: ['id', 'title', 'description', 'location', 'status']
            });
            res.status(200).json({ warehouses });
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
        const schema = Joi.object({
            title: Joi.string().required(),
            description: Joi.string().allow(null, ''),
            location: Joi.string().allow(null, ''),
            status: Joi.number().integer().valid(0, 1).default(0)
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en WarehouseController->store: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }

        try {
            const warehouse = await Warehouse.create(value);
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
        try {
            const warehouse = await Warehouse.findByPk(req.params.id, {
                attributes: ['id', 'title', 'description', 'location', 'status']
            });

            if (!warehouse) {
                return res.status(404).json({ error: 'NotFoundError', details: 'Warehouse not found' });
            }
            res.status(200).json({ warehouse });
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
        const schema = Joi.object({
            title: Joi.string(),
            description: Joi.string().allow(null, ''),
            location: Joi.string().allow(null, ''),
            status: Joi.number().integer().valid(0, 1)
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en WarehouseController->update: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }

        try {
            const warehouse = await Warehouse.findByPk(req.params.id);
            if (!warehouse) {
                return res.status(404).json({ error: 'NotFoundError', details: 'Warehouse not found' });
            }

            await warehouse.update(value);
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
        try {
            const warehouse = await Warehouse.findByPk(req.params.id);
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
