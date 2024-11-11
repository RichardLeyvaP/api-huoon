const { Op } = require('sequelize');
const Joi = require('joi');
const { Warehouse, Home, HomeWarehouse, sequelize } = require('../models');
const logger = require('../../config/logger');

const schema = Joi.object({
    title: Joi.string(),
    description: Joi.string().allow(null, ''),
    location: Joi.string().allow(null, ''),
    status: Joi.number().integer().valid(0, 1),
    home_id: Joi.number().integer().required(), // ID del hogar requerido al crear o actualizar
    warehouse_id: Joi.number().integer().optional() // ID del almacén requerido al crear o actualizar
});

const WarehouseController = {
    // Listar todos los almacenes
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a obtener todas las asociaciones entre hogares y almacenes`);
    
        try {
            // Obtener todas las asociaciones entre hogares y almacenes con los datos de la tabla pivote
            const homeWarehouses = await HomeWarehouse.findAll({
                include: [
                    {
                        model: Home,
                        as: 'home', // Asociación con el modelo Home
                        attributes: ['id', 'name'] // Puedes ajustar los atributos que quieres devolver
                    },
                    {
                        model: Warehouse,
                        as: 'warehouse', // Asociación con el modelo Warehouse
                        attributes: ['id', 'title', 'description', 'location', 'status'] // Ajustar según los atributos que desees
                    }
                ]
            });
    
            if (!homeWarehouses.length) {
                return res.status(404).json({ msg: 'No associations found', homeWarehouses: homeWarehouses });
            }
    
            // Devuelve las asociaciones de hogares y almacenes con los datos de la tabla pivote
            res.status(200).json({
                homeWarehouses: homeWarehouses.map(hw => ({
                    home_id: hw.home_id,
                    warehouse_id: hw.warehouse_id,
                    title: hw.title, // Atributo de la tabla pivote
                    description: hw.description, // Atributo de la tabla pivote
                    location: hw.location, // Atributo de la tabla pivote
                    status: hw.status, // Atributo de la tabla pivote
                    home: hw.home, // Información del hogar
                    warehouse: hw.warehouse // Información del almacén
                }))
            });
    
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async store(req, res) {
        logger.info(`${req.user.name} - Entra a asociar un alamcén a un hogar`);
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en WarehouseController->store: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const { home_id, warehouse_id, title, description, location, status } = value;

        
            // Verificar si el hogar existe
            const home = await Home.findByPk(home_id);
            if (!home) {
                logger.error(`WarehouseController->store: Hogar no encontrado con ID ${home_id}`);
                return res.status(404).json({ msg: 'HomeNotFound' });
            }

            
            let warehouse;
            if (warehouse_id !== undefined) {
                warehouse = await Warehouse.findByPk(warehouse_id);
                if (!warehouse) {
                    logger.error(`WarehouseController->store: Almacén no encontrado con ID ${warehouse_id}`);
                    return res.status(404).json({ msg: 'WarehouseNotFound' });
                }
            }
            const t = await sequelize.transaction(); // Iniciar una nueva transacción
        try {
               // Usar findOrCreate para crear un nuevo almacén si no se proporciona warehouse_id
                if (!warehouse) {
                    logger.info('WarehouseController->store: Creando nuevo almacén');
                    warehouse = await Warehouse.create({
                        title: value.title,
                        description: value.description,
                        location: value.location,
                        status: 0 // Estado por defecto 0 para los nuevos almacenes no asociados
                    }, { transaction: t });
                }
    
            // Asociar el almacén al hogar en la tabla pivote
            const [homeWarehouse, created] = await HomeWarehouse.findOrCreate({
                where: { home_id: home_id, warehouse_id: warehouse.id },
                defaults: {
                    title: title || warehouse.title,
                    description: description || warehouse.description,
                    location: location || warehouse.location,
                    status: status !== undefined ? status : 0,
                },
                transaction: t
            });
            /*await home.addWarehouse(warehouse, {
                through: {
                    title: title || warehouse.title,         // Asignar título del cuerpo o el que ya tiene el almacén
                    description: description || warehouse.description, // Asignar descripción
                    location: location || warehouse.location, // Asignar ubicación
                    status: status !== undefined ? status : 0, // Asignar el estado, si no se pasa, por defecto 1
                }
            }, { transaction: t });*/
            // Confirmar la transacción
            await t.commit();
               
            // Obtener la relación actualizada
            const updatedHomeWarehouse = await HomeWarehouse.findOne({
                where: {
                    home_id: home_id,
                    warehouse_id: warehouse.id
                }
            });
            res.status(201).json({ homeWarehouse: updatedHomeWarehouse });
        } catch (error) {
             // Si ocurre un error, hacer rollback de la transacción
             await t.rollback();
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->store: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
    // Ver detalles de un almacén específico
    async show(req, res) {
        logger.info(`${req.user.name} - Entra a buscar los almacenes del hogar`);
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en WarehouseController->update: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const { home_id } = value;
        try {

           // Verificar que el hogar existe
           const home = await Home.findByPk(home_id);
            if (!home) {
                logger.error(`WarehouseController->index: Hogar no encontrado con ID ${home_id}`);
                return res.status(404).json({ msg: 'HomeNotFound' });
            }
            const associatedAndUnassociatedWarehouses = await Warehouse.findAll({
                include: [{
                    model: Home,
                    as: 'homes',
                    required: false, // LEFT JOIN para incluir también los almacenes no asociados
                    where: {
                        id: home_id
                    },
                    attributes: []
                }],
                where: {
                    [Op.or]: [
                        { '$homes.id$': home_id },          // Almacenes asociados
                        { status: 1, '$homes.id$': null }    // Almacenes no asociados con `state = 1`
                    ]
                },
                attributes: ['id', 'title', 'description', 'location', 'status'],
                distinct: true, // Asegura que solo se devuelvan resultados únicos
            });
        
    
            res.status(200).json({ homeWarehouses: associatedAndUnassociatedWarehouses });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Actualizar un almacén
    async update(req, res) {
        logger.info(`${req.user.name} - Entra a actualizar un almacén a un hogar`);
        
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en WarehouseController->update: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const { home_id, warehouse_id, title, description, location, status } = value;
    
        // Verificar si el hogar existe
        const home = await Home.findByPk(home_id);
        if (!home) {
            logger.error(`WarehouseController->update: Hogar no encontrado con ID ${home_id}`);
            return res.status(404).json({ msg: 'HomeNotFound' });
        }
    
        let warehouse;
    
        if (warehouse_id) {
            warehouse = await Warehouse.findByPk(warehouse_id);
            if (!warehouse) {
                logger.error(`WarehouseController->update: Almacén no encontrado con ID ${warehouse_id}`);
                return res.status(404).json({ msg: 'WarehouseNotFound' });
            }
        }
    
        const t = await sequelize.transaction(); // Iniciar una nueva transacción
    
        try {
            // Si no se envió warehouse_id, creamos un nuevo almacén
            if (!warehouse_id) {
                logger.info('WarehouseController->update: Creando nuevo almacén');
                warehouse = await Warehouse.create({
                    title: title,
                    description: description,
                    location: location,
                    status: 0
                }, { transaction: t });
            }
    
            // Usar findOrCreate para evitar la consulta y el insert por separado
            const [homeWarehouse, created] = await HomeWarehouse.findOrCreate({
                where: { home_id: home_id, warehouse_id: warehouse.id },
                defaults: {
                    title: title || warehouse.title,
                    description: description || warehouse.description,
                    location: location || warehouse.location,
                    status: status !== undefined ? status : 0,
                },
                transaction: t
            });
    
            // Si la relación ya existía, actualizamos solo los campos modificados
            if (!created) {
                const updatedData = Object.keys(req.body)
                    .filter(key => ['title', 'description', 'location', 'status'].includes(key) && req.body[key] !== undefined)
                    .reduce((obj, key) => {
                        obj[key] = req.body[key];
                        return obj;
                    }, {});
    
                if (Object.keys(updatedData).length > 0) {
                    await homeWarehouse.update(updatedData, { transaction: t });
                    logger.info(`Relación actualizada entre hogar ID ${home_id} y almacén ID ${warehouse.id}`);
                }
            }
    
            // Obtener la relación actualizada
            const updatedHomeWarehouse = await HomeWarehouse.findOne({
                where: { home_id: home_id, warehouse_id: warehouse.id },
                transaction: t
            });
    
            // Confirmar la transacción
            await t.commit();
    
            // Responder con la relación actualizada
            res.status(200).json({ homeWarehouse: updatedHomeWarehouse });
        } catch (error) {
            // Si ocurre un error, hacer rollback de la transacción
            await t.rollback();
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->update: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Eliminar un almacén
    async destroy(req, res) {
        logger.info(`${req.user.name} - Entra a eliminar la asociación entre un almacén y un hogar`);
    
        const { home_id, warehouse_id } = req.body; // Supongo que el home_id y warehouse_id se pasan por los parámetros de la URL
    
        try {
            // Verificar si el hogar existe
            const home = await Home.findByPk(home_id);
            if (!home) {
                logger.error(`WarehouseController->destroy: Hogar no encontrado con ID ${home_id}`);
                return res.status(404).json({ msg: 'HomeNotFound' });
            }
    
            // Verificar si el almacén existe
            const warehouse = await Warehouse.findByPk(warehouse_id);
            if (!warehouse) {
                logger.error(`WarehouseController->destroy: Almacén no encontrado con ID ${warehouse_id}`);
                return res.status(404).json({ msg: 'WarehouseNotFound' });
            }
    
            // Eliminar la relación entre el hogar y el almacén
            await home.removeWarehouse(warehouse);
    
            // Si el estado del almacén es 0, eliminar el almacén de la tabla warehouses
            if (warehouse.status === 0) {
                logger.info(`WarehouseController->destroy: El almacén tiene estado 0, eliminando de la tabla warehouses`);
                await warehouse.destroy();
            }
    
            res.status(200).json({ msg: 'AssociationRemoved', details: 'La relación entre el hogar y el almacén ha sido eliminada' });
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
