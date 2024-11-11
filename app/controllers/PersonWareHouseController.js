const { Op } = require('sequelize');
const Joi = require('joi');
const { Warehouse, Home, PersonWarehouse, Person, HomePerson, HomeWarehouse, sequelize } = require('../models');
const logger = require('../../config/logger');

const schema = Joi.object({
    title: Joi.string(),
    description: Joi.string().allow(null, ''),
    location: Joi.string().allow(null, ''),
    status: Joi.number().integer().valid(0, 1),
    home_id: Joi.number().integer().required(), // ID del hogar requerido al crear o actualizar
    //person_id: Joi.number().integer().required(), // ID del hogar requerido al crear o actualizar
    warehouse_id: Joi.number().integer().optional() // ID del almacén requerido al crear o actualizar
});

const PersonWarehouseController = {
    // Listar todos los almacenes
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a obtener todas las asociaciones entre personas y almacenes`);
    
        try {
            // Obtener todas las asociaciones entre personas y almacenes con los datos de la tabla pivote
            const personWarehouses = await PersonWarehouse.findAll({
                include: [
                    {
                        model: Person,
                        as: 'person', // Asociación con el modelo Person
                        attributes: ['id', 'name'] // Ajusta los atributos de Person que quieres devolver
                    },
                    {
                        model: Warehouse,
                        as: 'warehouse', // Asociación con el modelo Warehouse
                        attributes: ['id', 'title', 'description', 'location', 'status'] // Ajusta los atributos de Warehouse según sea necesario
                    }
                ]
            });
    
            if (!personWarehouses.length) {
                return res.status(404).json({ msg: 'No associations found', personWarehouses: personWarehouses });
            }
    
            // Devuelve las asociaciones de personas y almacenes con los datos de la tabla pivote
            res.status(200).json({
                personWarehouses: personWarehouses.map(pw => ({
                    person_id: pw.person_id, // ID de la persona
                    warehouse_id: pw.warehouse_id, // ID del almacén
                    title: pw.title, // Atributo de la tabla pivote
                    description: pw.description, // Atributo de la tabla pivote
                    location: pw.location, // Atributo de la tabla pivote
                    status: pw.status, // Atributo de la tabla pivote
                    person: pw.person, // Información de la persona
                    warehouse: pw.warehouse // Información del almacén
                }))
            });
    
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en PersonWarehouseController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async store(req, res) {
        logger.info(`${req.user.name} - Entra a asociar un almacén a una persona en un hogar específico`);
        
        // Validar el cuerpo de la solicitud
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en PersonWarehouseController->store: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const { home_id, warehouse_id, title, description, location, status } = value;
        const person_id = req.user.person.id;
        // Verificar si el hogar existe
        const home = await Home.findByPk(home_id);
        if (!home) {
            logger.error(`PersonWarehouseController->store: Hogar no encontrado con ID ${home_id}`);
            return res.status(404).json({ msg: 'HomeNotFound' });
        }

        // Verificar si la persona existe y pertenece al hogar
        const person = await Person.findByPk(person_id, {
            include: [{
                model: HomePerson,
                as: 'homePeople',
                where: { home_id: home_id },  // Filtra por el home_id que buscas
                required: true  // Esto asegura que solo se devuelvan personas que tengan esa relación
            }]
        });
        
        if (!person) {
            logger.error(`PersonWarehouseController->store: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`);
            return res.status(404).json({ msg: 'PersonNotAssociatedWithHome' });
        }

        // Buscar o crear el almacén según `warehouse_id`
        let warehouse;
        if (warehouse_id !== undefined) {
            warehouse = await Warehouse.findByPk(warehouse_id);
            if (!warehouse) {
                logger.error(`PersonWarehouseController->store: Almacén no encontrado con ID ${warehouse_id}`);
                return res.status(404).json({ msg: 'WarehouseNotFound' });
            }
        } 
        // Iniciar una transacción
        const t = await sequelize.transaction();
        try {        
            if (!warehouse) {    
                logger.info('PersonWarehouseController->store: Creando nuevo almacén');
                warehouse = await Warehouse.create({
                    title: title,
                    description: description,
                    location: location,
                    status: 0 // Estado por defecto 0 para nuevos almacenes no asociados
                }, { transaction: t });
            }
    
            // Asociar el almacén a la persona dentro del hogar en `person_warehouse`
            const [personWarehouse, created] = await PersonWarehouse.findOrCreate({
                where: {
                    person_id: person_id,
                    warehouse_id: warehouse.id,
                    home_id: home_id // Relacionamos con el hogar correcto
                },
                defaults: {
                    title: title || warehouse.title,
                    description: description || warehouse.description,
                    location: location || warehouse.location,
                    status: status !== undefined ? status : 0,
                },
                transaction: t
            });
            /*await person.addWarehouse(warehouse, {
                through: {
                    home_id: home_id,                      // Asignar `home_id` en la tabla pivote
                    title: title || warehouse.title,       // Asignar título del cuerpo o del almacén
                    description: description || warehouse.description, // Asignar descripción
                    location: location || warehouse.location, // Asignar ubicación
                    status: status !== undefined ? status : 0 // Estado por defecto
                }
            }, { transaction: t });*/
    
            // Confirmar la transacción
            await t.commit();
    
            // Obtener la relación actualizada desde `PersonWarehouse`
            const updatedPersonWarehouse = await PersonWarehouse.findOne({
                where: {
                    home_id: home_id,
                    person_id: person_id,
                    warehouse_id: warehouse.id
                }
            });
            res.status(201).json({ personWarehouse: updatedPersonWarehouse });
    
        } catch (error) {
            // Hacer rollback en caso de error
            await t.rollback();
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en PersonWarehouseController->store: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
    // Ver detalles de un almacén específico
    async show(req, res) {
        logger.info(`${req.user.name} - Entra a buscar los almacenes asociados y no asociados para la persona en el hogar`);
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en WarehouseController->show: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const { home_id} = value;
        const person_id = req.user.person.id;
    
        try {
            // Verificar que el hogar existe
            const home = await Home.findByPk(home_id);
            if (!home) {
                logger.error(`WarehouseController->show: Hogar no encontrado con ID ${home_id}`);
                return res.status(404).json({ msg: 'HomeNotFound' });
            }
    
            // Verificar si la persona existe y pertenece al hogar
            const person = await Person.findByPk(person_id, {
                include: [{
                    model: HomePerson,
                    as: 'homePeople',
                    where: { home_id: home_id },  // Filtra por el home_id que buscas
                    required: true  // Esto asegura que solo se devuelvan personas que tengan esa relación
                }]
            });
            
            if (!person) {
                logger.error(`PersonWarehouseController->store: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`);
                return res.status(404).json({ msg: 'PersonNotAssociatedWithHome' });
            }
    
            // Obtener almacenes asociados y no asociados, con estado `1` en `home_warehouse`
            const associatedAndUnassociatedWarehouses = await Warehouse.findAll({
                include: [
                    {
                        model: Home,
                        as: 'homes', // Relación con la tabla Home
                        required: false, // Permite incluir también los almacenes no asociados
                        where: { id: home_id }, // Relación con el hogar especificado
                        through: {
                            model: HomeWarehouse, // Aseguramos que estamos usando la tabla pivote `home_warehouse`
                            attributes: [],
                            where: {
                                // Filtra para el hogar dado y `status` en la tabla pivote
                                status: 1
                            }
                        },
                        attributes: [] // No devolver datos de la relación con `homes`
                    },
                    {
                        model: Person, // Relación con la tabla Person para verificar si la persona está asociada
                        as: 'people', // Relación entre los almacenes y las personas (person_warehouse)
                        required: false, // Permite que los almacenes no asociados con la persona se incluyan
                        through: {
                            model: PersonWarehouse, // Aseguramos que estamos usando la tabla pivote `person_warehouse`
                            attributes: [],
                            where: {
                                person_id: person_id // Filtra para la persona dada
                            }
                        },
                        attributes: [] // No devolver datos de la relación con `homes`
                    }
                ],
                attributes: ['id', 'title', 'description', 'location', 'status'],
                distinct: true, // Evita duplicados
            });
    
            res.status(200).json({ homeWarehouses: associatedAndUnassociatedWarehouses });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async update(req, res) {
        logger.info(`${req.user.name} - Entra a actualizar la relación entre persona, almacén y hogar específico`);
    
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en PersonWarehouseController->update: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const {warehouse_id, home_id, title, description, location, status } = value;

        // Verificar si el hogar existe
        const home = await Home.findByPk(home_id);
        if (!home) {
            logger.error(`PersonWarehouseController->update: Hogar no encontrado con ID ${home_id}`);
            return res.status(404).json({ msg: 'HomeNotFound' });
        }

        const person_id = req.user.person.id;
         // Verificar si la persona existe y pertenece al hogar
         const person = await Person.findByPk(person_id, {
            include: [{
                model: HomePerson,
                as: 'homePeople',
                where: { home_id: home_id },  // Filtra por el home_id que buscas
                required: true  // Esto asegura que solo se devuelvan personas que tengan esa relación
            }]
        });
        
        if (!person) {
            logger.error(`PersonWarehouseController->store: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`);
            return res.status(404).json({ msg: 'PersonNotAssociatedWithHome' });
        }
    
        let warehouse;
    
        if (warehouse_id !== undefined) {
            warehouse = await Warehouse.findByPk(warehouse_id);
            if (!warehouse) {
                logger.error(`PersonWarehouseController->update: Almacén no encontrado con ID ${warehouse_id}`);
                return res.status(404).json({ msg: 'WarehouseNotFound' });
            }
        }
    
    
        const t = await sequelize.transaction(); // Iniciar una nueva transacción
    
        try {

             // Si no se envió warehouse_id, creamos un nuevo almacén
             if (!warehouse_id) {
                logger.info('PersonWarehouseController->update: Creando nuevo almacén');
                warehouse = await Warehouse.create({
                    title: title,
                    description: description,
                    location: location,
                    status: 0
                }, { transaction: t });
            }
            // Verificar si la relación entre la persona, el almacén y el hogar ya existe
            const [personWarehouse, created] = await PersonWarehouse.findOrCreate({
                where: {
                    person_id: person_id,
                    warehouse_id: warehouse.id,
                    home_id: home_id // Relacionamos con el hogar correcto
                },
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
                // Filtramos y preparamos los datos que deben actualizarse
                const updatedData = Object.keys(req.body)
                    .filter(key => ['title', 'description', 'location', 'status'].includes(key) && req.body[key] !== undefined)
                    .reduce((obj, key) => {
                        obj[key] = req.body[key];
                        return obj;
                    }, {});
    
                if (Object.keys(updatedData).length > 0) {
                    await personWarehouse.update(updatedData, { transaction: t });
                    logger.info(`Relación actualizada entre persona ID ${person_id}, hogar ID ${home_id} y almacén ID ${warehouse_id}`);
                }
            }
    
            // Obtener la relación actualizada
            const updatedPersonWarehouse = await PersonWarehouse.findOne({
                where: { person_id: person_id, warehouse_id: warehouse_id, home_id: home_id },
                transaction: t
            });
    
            // Confirmar la transacción
            await t.commit();
    
            // Responder con la relación actualizada
            res.status(200).json({ personWarehouse: updatedPersonWarehouse });
        } catch (error) {
            // Si ocurre un error, hacer rollback de la transacción
            await t.rollback();
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en PersonWarehouseController->update: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Eliminar un almacén
    async destroy(req, res) {
        logger.info(`${req.user.name} - Inicia la eliminación de la relación entre una persona y un almacén en un hogar`);
    
        const { home_id, warehouse_id, person_id } = req.body; // Suponemos que `home_id`, `warehouse_id`, y `person_id` se pasan en el cuerpo de la solicitud
    
        // Verificación de la existencia de los datos necesarios
        try {
            // Verificar si el hogar existe
            const home = await Home.findByPk(home_id);
            if (!home) {
                logger.error(`PersonWarehouseController->destroy: Hogar no encontrado con ID ${home_id}`);
                return res.status(404).json({ msg: 'HomeNotFound' });
            }
    
            // Verificar si el almacén existe
            const warehouse = await Warehouse.findByPk(warehouse_id);
            if (!warehouse) {
                logger.error(`PersonWarehouseController->destroy: Almacén no encontrado con ID ${warehouse_id}`);
                return res.status(404).json({ msg: 'WarehouseNotFound' });
            }
    
            // Verificar si la persona existe
            const person = await Person.findByPk(person_id);
            if (!person) {
                logger.error(`PersonWarehouseController->destroy: Persona no encontrada con ID ${person_id}`);
                return res.status(404).json({ msg: 'PersonNotFound' });
            }
    
            // Iniciar una nueva transacción para asegurar que todo se haga correctamente
            const t = await sequelize.transaction();
    
            try {
                // Verificar si existe la relación entre la persona, el almacén y el hogar
                const personWarehouse = await PersonWarehouse.findOne({
                    where: { home_id, warehouse_id, person_id },
                    transaction: t
                });
    
                if (!personWarehouse) {
                    logger.error(`PersonWarehouseController->destroy: Relación no encontrada entre persona ID ${person_id}, hogar ID ${home_id} y almacén ID ${warehouse_id}`);
                    return res.status(404).json({ msg: 'RelationNotFound' });
                }
    
                // Eliminar la relación entre la persona, el hogar y el almacén
                await personWarehouse.destroy({ transaction: t });
    
                // Si el almacén tiene estado 0, también eliminarlo de la tabla `warehouses`
                if (warehouse.status === 0) {
                    logger.info(`PersonWarehouseController->destroy: El almacén tiene estado 0, eliminando de la tabla warehouses`);
                    await warehouse.destroy({ transaction: t });
                }
    
                // Confirmar la transacción
                await t.commit();
    
                // Responder con éxito
                res.status(200).json({ msg: 'AssociationRemoved', details: 'La relación entre la persona, el hogar y el almacén ha sido eliminada' });
            } catch (error) {
                // Si ocurre un error, hacer rollback de la transacción
                await t.rollback();
                const errorMsg = error.details
                    ? error.details.map(detail => detail.message).join(', ')
                    : error.message || 'Error desconocido';
                logger.error('Error en PersonWarehouseController->destroy: ' + errorMsg);
                res.status(500).json({ error: 'ServerError', details: errorMsg });
            }
        } catch (error) {
            // Manejo de errores generales
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en PersonWarehouseController->destroy: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }
}

module.exports = PersonWarehouseController;
