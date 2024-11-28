const { Op, Sequelize } = require('sequelize');
const Joi = require('joi');
const { Warehouse, Home, PersonWarehouse, Person, HomePerson, HomeWarehouse, sequelize } = require('../models');
const logger = require('../../config/logger');
const i18n = require('../../config/i18n-config');

const schema = Joi.object({
    title: Joi.string(),
    description: Joi.string().allow(null).empty('').optional(),
    location: Joi.string().allow(null).empty('').optional(),
    status: Joi.number().integer().valid(0, 1, 2).default(0).allow(null).empty('').optional(),
    home_id: Joi.number().integer().allow(null).empty('').optional(), // ID del hogar requerido al crear o actualizar
    id: Joi.number().integer().allow(null).empty('').optional(), // ID del hogar requerido al crear o actualizar
    warehouse_id: Joi.number().integer().allow(null).empty('').optional() // ID del almacén requerido al crear o actualizar
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
        logger.info('datos recibidos al crear un almacen');
        logger.info(JSON.stringify(req.body));
        // Validar el cuerpo de la solicitud
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en PersonWarehouseController->store: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const { home_id, warehouse_id, title, description, location, status } = value;
        const person_id = req.person.id;
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
    
        const { home_id, warehouse_id} = value;
        const person_id = req.person.id;
    
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

            const warehouse = await Warehouse.findByPk(warehouse_id);
            if (!warehouse) {
                logger.error(`PersonWarehouseController->store: Almacén no encontrado con ID ${warehouse_id}`);
                return res.status(404).json({ msg: 'WarehouseNotFound' });
            }
    
            const personWarehouse = await PersonWarehouse.findOne({
                where: {
                    warehouse_id,  // Almacén específico
                    home_id         // Hogar específico
                },
                attributes: ['warehouse_id', 'title', 'description', 'location', 'status'], // Datos relevantes
            });
    
            // Si no se encuentra la relación, se devuelve un error 404
            if (!personWarehouse) {
                logger.info(`No se encontró la relación entre el almacén ID ${warehouse_id} y el hogar ${home_id}`);
                return res.status(204).json({ msg: 'StoreNotFound' });
            }
    
            // Formatear la respuesta para el cliente
            const result = {
                id: personWarehouse.warehouse_id, // ID del almacén
                title: personWarehouse.title,
                description: personWarehouse.description,
                location: personWarehouse.location,
                status: personWarehouse.status
            };
    
            // Responder con la relación encontrada
            return res.status(200).json({ store: result });
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
        logger.info('datos recibidos al editar un almacen');
        logger.info(JSON.stringify(req.body));
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en PersonWarehouseController->update: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const {id, warehouse_id, home_id, title, description, location, status } = value;

        const personWarehouse = await PersonWarehouse.findByPk(id);
        if (!personWarehouse) {
            logger.error(`PersonWarehouseController->update: Almacén no encontrado con ID ${id}`);
            return res.status(204).json({ msg: 'HomeNotFound' });
        }
        // Verificar si el hogar existe
        const home = await Home.findByPk(home_id);
        if (!home) {
            logger.error(`PersonWarehouseController->update: Hogar no encontrado con ID ${home_id}`);
            return res.status(204).json({ msg: 'HomeNotFound' });
        }

        const person_id = req.person.id;
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
            return res.status(204).json({ msg: 'PersonNotAssociatedWithHome' });
        }    
    
        const t = await sequelize.transaction(); // Iniciar una nueva transacción
    
        try {
               
            // Validar si la relación ya existe
            if (personWarehouse) {
                const isOwner = personWarehouse.person_id === person_id;
    
                // Validar permisos
                if (!isOwner && personWarehouse.status !== 1) {
                    logger.warn(`Usuario ${person_id} intentó editar una relación que no le pertenece ni tiene status 1`);
                    await t.rollback();
                    return res.status(403).json({ msg: 'Forbidden: Insufficient permissions to edit this record' });
                }
    
                // Actualizar campos permitidos
                const updatedData = Object.keys(req.body)
                    .filter(key => ['title', 'description', 'location', 'status'].includes(key) && req.body[key] !== undefined)
                    .reduce((obj, key) => {
                        obj[key] = req.body[key];
                        return obj;
                    }, {});
    
                if (Object.keys(updatedData).length > 0) {
                    await personWarehouse.update(updatedData, { transaction: t });
                    logger.info(`Relación actualizada entre hogar ID ${home_id} y almacén ID ${warehouse_id}`);
                }
    
                // Confirmar la transacción
                await t.commit();
    
                // Retornar el registro actualizado
                return res.status(200).json({ personWarehouse });
            } else {
                // Si no existe la relación y no es el propietario, no crear una nueva
                logger.error(`No se encontró relación y no se permite crear una nueva para el usuario ${person_id}`);
                await t.rollback();
                return res.status(404).json({ msg: 'PersonWarehouseNotFound' });
            }
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
        logger.info('datos recibidos al eliminar un almacen');
        logger.info(JSON.stringify(req.body));

        const schema = Joi.object({
            id: Joi.number().required()
        });
    
        const { error, value} = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en PersonWarehouseController->destroy: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        } 

        const person_id = req.person.id;
        const { id } = value; // Suponemos que `home_id`, `warehouse_id` se pasan en el cuerpo de la solicitud
    
        // Verificación de la existencia de los datos necesarios
        try {

            // Iniciar una nueva transacción para asegurar que todo se haga correctamente
            const t = await sequelize.transaction();
    
            try {
                // Verificar si existe la relación entre la persona, el almacén y el hogar
                const personWarehouse = await PersonWarehouse.findByPk(id);
    
                if (personWarehouse.person_id !== person_id) {
                    logger.error(`PersonWarehouseController->destroy: Relación no encontrada entre persona ID ${person_id}, hogar ID ${home_id} y almacén ID ${warehouse_id}`);
                    return res.status(204).json({ msg: 'RelationNotFound' });
                }
    
                // Eliminar la relación entre la persona, el hogar y el almacén
                await personWarehouse.destroy({ transaction: t });
                
                const warehouse = await Warehouse.findByPk(personWarehouse.warehouse_id);
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
    },

    async getWarehouses(req, res) {
        logger.info(`${req.user.name} - Entra a buscar los almacenes asociados a él`);
    
        const personId = req.person.id;
        const { home_id } = req.body; // Suponemos que `home_id` se pasa en el cuerpo de la solicitud
    
        try {
            // Verificar si el hogar existe
            const home = await Home.findByPk(home_id);
            if (!home) {
                logger.error(`PersonWarehouseController->getWarehouses: Hogar no encontrado con ID ${home_id}`);
                return res.status(404).json({ msg: 'HomeNotFound' });
            }
    
            // Verificar si la persona existe
            const person = await Person.findByPk(personId);
            if (!person) {
                logger.error(`PersonWarehouseController->getWarehouses: Persona no encontrada con ID ${personId}`);
                return res.status(404).json({ msg: 'PersonNotFound' });
            }
    
            // Obtener los almacenes que tienen status 1 o 0 relacionados con la persona o el hogar
            // Consulta para obtener directamente desde PersonWarehouse
        const personWarehouses = await PersonWarehouse.findAll({
            where: {
                home_id, // Relacionado al hogar
                [Op.or]: [
                    // Relación directa con la persona y el hogar (todos los estados)
                    {
                        person_id: personId,
                        status: { [Op.in]: [0, 1, 2] }
                    },
                    // Relación indirecta (otra persona), pero con status 1 o 2
                    {
                        person_id: { [Op.ne]: personId },
                        status: { [Op.in]: [1, 2] }
                    }
                ]
            },
            attributes: ['warehouse_id', 'title', 'description', 'location', 'status'], // Incluye los datos relevantes
            include: [
                {
                    model: Warehouse,
                    as: 'warehouse', // Relación con Warehouse para obtener información adicional si es necesario
                    attributes: [] // Si no necesitas datos de Warehouse, omítelos
                }
            ]
        });

        // Formatear resultados para el cliente
        const result = personWarehouses.map((pw) => ({
            id: pw.id, // ID del almacén
            warehouse_id: pw.warehouse_id,
            title: pw.title ? pw.title : "",
            description: pw.description ? pw.description : "",
            location: pw.location ? pw.location : "",
            status: pw.status,
            creator: pw.person_id === personId // Agrega la propiedad creator
        }));
    
            return res.status(200).json({ store: result });
    
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en PersonWarehouseController->getWarehouses: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }   
}

module.exports = PersonWarehouseController;
