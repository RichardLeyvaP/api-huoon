const logger = require('../../config/logger');
const i18n = require('../../config/i18n-config');
const {WareHouseRepository} = require('../repositories');

const WarehouseController =  {
    // Listar todos los almacenes
    async index(req, res) {
        logger.info(`${req.user.name} - 'Entra abuscar los almacenes'`);
        try {
            const warehouses = await WareHouseRepository.findAll();
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
   
        try {
            const warehouse = await WareHouseRepository.create(req.body);
            res.status(201).json({ 'warehouse': warehouse });
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
   
        try {
            const warehouse = await WareHouseRepository.findById(req.body.id);

            if (!warehouse) {
                return res.status(404).json({ error: 'NotFoundError', details: 'Warehouse not found' });
            }
            res.status(200).json({ 'warehouses': warehouse });
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

        try {
            const warehouse = await WareHouseRepository.findById(req.body.id);
            if (!warehouse) {
                return res.status(404).json({ error: 'NotFoundError', details: 'Warehouse not found' });
            }

            const warehouseUpdate = await WareHouseRepository.update(warehouse, req.body);
            res.status(200).json({ warehouseUpdate });
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

        try {
            const warehouse = await WareHouseRepository.findById(req.body.id);
            if (!warehouse) {
                return res.status(404).json({ error: 'NotFoundError', details: 'Warehouse not found' });
            }

            const warehouseDelete = await WareHouseRepository.delete(warehouse);
            res.status(200).json({ message: 'Warehouse deleted successfully' });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->destroy: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async getWarehouses(req, res) {
        logger.info('Entra a Buscar Los alamcenes en (WareHouseController-getWarehouses)');
        try {
            const warehouses = await WareHouseRepository.findByStatus(id);
    
            const warehouseMap = warehouses.map(warehouse => {
                return {
                    id: warehouse.id,
                    title:  i18n.__(`warehouse.${warehouse.title}.title`) !== `warehouse.${warehouse.title}.title` ? i18n.__(`warehouse.${warehouse.title}.title`) : warehouse.title,
                    description: i18n.__(`warehouse.${warehouse.title}.title`) !== `warehouse.${warehouse.title}.title` ? i18n.__(`warehouse.${warehouse.title}.description`) : warehouse.description,
                    location: i18n.__(`warehouse.${warehouse.title}.title`) !== `warehouse.${warehouse.title}.title` ? i18n.__(`warehouse.${warehouse.title}.location`) : warehouse.location
                };
            });
            res.status(200).json({ stores: warehouseMap });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->getWarehouses: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
}
module.exports = WarehouseController;
