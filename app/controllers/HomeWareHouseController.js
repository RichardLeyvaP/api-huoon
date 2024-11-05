const Joi = require('joi');
const { Warehouse } = require('../models');
const logger = require('../../config/logger');

const schema = Joi.object({
    title: Joi.string(),
    description: Joi.string().allow(null, ''),
    location: Joi.string().allow(null, ''),
    status: Joi.number().integer().valid(0, 1),
    homeId: Joi.number().integer().required(), // ID del hogar requerido al crear o actualizar
    warehouseId: Joi.number().integer().required() // ID del almacén requerido al crear o actualizar
});

const WarehouseController = {
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

        // Aquí podrías tener un modelo de relación si estás usando una tabla pivote
        const existingRelation = await warehouse.getHomes({ where: { id: value.homeId } });
        
        // Si no existe la relación, crearla
        if (!existingRelation.length) {
            await warehouse.addHome(value.homeId);
        }

        // Mezclar los valores proporcionados con los existentes
        const updatedValues = {
            title: value.title || warehouse.title,
            description: value.description || warehouse.description,
            location: value.location || warehouse.location,
            status: value.status !== undefined ? value.status : warehouse.status,
            homeId: value.homeId, // Asegurarse de que se mantenga el nuevo homeId
            warehouseId: value.warehouseId // Asegurarse de que se mantenga el nuevo warehouseId
        };

        // Actualizar el almacén con los nuevos valores
        await warehouse.update(updatedValues);
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
