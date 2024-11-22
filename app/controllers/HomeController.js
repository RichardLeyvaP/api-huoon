const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const { Home, HomeType, Status, sequelize } = require('../models');  // Importar el modelo Home
const logger = require('../../config/logger'); // Importa el logger

// Esquema de validación de Joi
const schema = Joi.object({
    name: Joi.string().max(255).allow(null, ''),
    address: Joi.string().allow(null, ''),
    home_type_id: Joi.number().integer().optional(),
    residents: Joi.number().integer().default(1).allow(null),
    geo_location: Joi.string().allow(null, ''),
    timezone: Joi.string().allow(null, ''),
    status_id: Joi.number().integer().optional(),
    image: Joi.string().allow(null, ''),
    id: Joi.number().optional(),
});

const HomeController = {
    // Obtener todas las casas
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar las casas`);

        try {
            const homes = await Home.findAll({
                attributes: ['id', 'name', 'address', 'home_type_id', 'residents', 'geo_location', 'timezone', 'status_id', 'image'],
                include: [{
                    model: HomeType,
                    as: 'homeType',
                    attributes: ['id', 'name'],
                },{
                    model: Status,
                    as: 'status',
                    attributes: ['id', 'name'],
                }],
            });

            if (!homes.length) {
                return res.status(204).json({ msg: 'HomesNotFound' });
            }

            // Mapear la respuesta
        const mappedHomes = homes.map(home => {
            const homeType = home.homeType; // Obtener el tipo de casa relacionado
            return {
                id: home.id,
                statusId: home.status_id,
                name: home.name,
                address: home.address,
                homeTypeId: home.home_type_id,
                nameHomeType: homeType ? homeType.name : null, // Manejo de caso cuando no hay tipo de casa
                residents: home.residents,
                geoLocation: home.geo_location,
                timezone: home.timezone,
                nameStatus: home.status.name, // Aquí asumo que tienes una propiedad status directa en el modelo
                image: home.image,
            };
        });

            res.status(200).json({ 'homes': mappedHomes });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('HomeController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Crear una nueva casa
    async store(req, res) {
        logger.info(`${req.user.name} - Crea una nueva casa`);

        const { error, value } = schema.validate(req.body);

        if (error) {
            logger.error(`Error de validación en HomeController->store: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

         // Verificar si el tipo de hogar existe
         const homeType = await HomeType.findByPk(value.home_type_id);
         if (!homeType) {
             logger.error(`HomeController->store: Typo de Hogar no encontrado con ID ${value.home_type_id}`);
             return res.status(404).json({ msg: 'TypeHomeNotFound' });
         }
         // Verificar si el estado exista
         const status = await Status.findByPk(value.status_id);
         if (!status) {
             logger.error(`HomeController->store: Estado no encontrado con ID ${value.status_id}`);
             return res.status(404).json({ msg: 'StatusNotFound' });
         }

        const t = await sequelize.transaction();
        try {
            let filename = 'homes/default.jpg'; // Imagen por defecto
            const home = await Home.create({
                name: value.name,
                address: value.address,
                home_type_id: value.home_type_id,
                residents: value.residents,
                geo_location: value.geo_location,
                timezone: value.timezone,
                status_id: value.status_id,
                image: filename,
            }, { transaction: t });

            // Manejo del archivo de icono (si se ha subido)
            if (req.file) {
                const extension = path.extname(req.file.originalname);
                const newFilename = `homes/${home.id}${extension}`;
                
                try {
                    // Mover el archivo a la carpeta pública
                    const oldPath = req.file.path;
                    const newPath = path.join(__dirname, '..', '..', 'public', newFilename);
            
                    await fs.promises.rename(oldPath, newPath); // Usa await para esperar hasta que se mueva
            
                    // Actualizar el registro con la ruta del archivo
                    await home.update({ image: newFilename }, { transaction: t });
                } catch (err) {
                    logger.error('Error al mover la imagen: ' + err.message);
                    throw new Error('Error al mover la imagen'); // Esto permitirá que el catch lo maneje y haga rollback
                }
            }
            await t.commit();
            res.status(201).json({ home });
        } catch (error) {
            await t.rollback();
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('HomeController->store: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async show(req, res) {
        logger.info(`${req.user.name} - Entra a buscar un home`);
        const id = req.body.id; // Asegúrate de convertir a número
        
        try {
            const home = await Home.findOne({
                where: { id },
                include: [{
                    model: HomeType,
                    as: 'homeType',
                    attributes: ['id', 'name'],
                },{
                    model: Status,
                    as: 'status',
                    attributes: ['id', 'name'],
                }],
            });
    
            if (!home) {
                return res.status(404).json({ msg: 'HomeNotFound' });
            }
    
            const mappedHome = {
                id: home.id,
                statusId: home.status_id,
                name: home.name,
                address: home.address,
                homeTypeId: home.home_type_id,
                nameHomeType: home.homeType ? home.homeType.name : null,
                residents: home.residents,
                geoLocation: home.geo_location,
                timezone: home.timezone,
                nameStatus: home.status.name,
                image: home.image,
            };
    
            res.status(200).json({ 'homes': mappedHome });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('HomeController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Actualizar una casa
    async update(req, res) {
        logger.info(`${req.user.name} - Actualiza el home con ID ${req.body.id}`);

        const { error, value } = schema.validate({...req.body});

        if (error) {
            logger.error(`Error de validación en HomeController->update: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

        if (status_id) {
            // Verificar si el estado exista
         const status = await Status.findByPk(value.status_id);
         if (!status) {
             logger.error(`HomeController->update: Estado no encontrado con ID ${value.status_id}`);
             return res.status(404).json({ msg: 'StatusNotFound' });
         }
        }

        const t = await sequelize.transaction();
        try {
            const home = await Home.findByPk(value.id);

            if (!home) {
                return res.status(404).json({ msg: 'HomeNotFound' });
            }
             // Lista de campos que pueden ser actualizados
             const fieldsToUpdate = ['name', 'address', 'home_type_id', 'residents', 'geo_location', 'timezone', 'status_id'];
           // Filtrar los campos presentes en req.body y construir el objeto updatedData
           const updatedData = Object.keys(req.body)
           .filter(key => fieldsToUpdate.includes(key) && req.body[key] !== undefined)
           .reduce((obj, key) => {
               obj[key] = req.body[key];
               return obj;
           }, {});

           // Procesar la imagen si se sube una nueva
           if (req.file) {
               // Si se envía un archivo nuevo
               const extension = path.extname(req.file.originalname);
               const newFilename = `homes/${home.id}${extension}`;

               // Eliminar la imagen anterior si existe y no es el predeterminado
               if (home.image && home.image !== 'homes/default.jpg') {
                   const oldIconPath = path.join(__dirname, '../../public', home.image);
                   try {
                       await fs.promises.unlink(oldIconPath);
                       logger.info(`Imagen anterior eliminado: ${oldIconPath}`);
                   } catch (error) {
                       logger.error(`Error al eliminar la imagen anterior: ${error.message}`);
                   }
               }

               // Mover el nuevo archivo a la carpeta pública
               const newPath = path.join(__dirname, '../../public', newFilename);
               await fs.promises.rename(req.file.path, newPath);

               // Guardar la ruta completa de la nueva imagen en la base de datos
               updatedData.image = `${newFilename}`;
           }
           // Actualizar solo si hay datos que cambiar
           if (Object.keys(updatedData).length > 0) {
               await home.update(updatedData);
               logger.info(`Home actualizado exitosamente (ID: ${home.id})`);
           }

            await t.commit();
            res.status(200).json({ home });
        } catch (error) {
            await t.rollback();
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';

        logger.error('HomeController->update: ' + errorMsg);
        res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Eliminar una casa
    async destroy(req, res) {
        logger.info(`${req.user.name} - Elimina home con ID ${req.body.id}`);

        // Validación de los datos con Joi
        const schema = Joi.object({
            id: Joi.number().required()
        });
    
        const { error } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en HomeController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        const t = await sequelize.transaction();
        try {
            const home = await Home.findByPk(req.body.id);

            if (!home) {
                return res.status(404).json({ msg: 'HomeNotFound' });
            }

            // Eliminar la imagen anterior si existe y no es el predeterminado
            if (home.image && home.image !== 'homes/default.jpg') {
                const oldIconPath = path.join(__dirname, '../../public', home.image);
                try {
                    await fs.promises.unlink(oldIconPath);
                    logger.info(`Imagen anterior eliminado: ${oldIconPath}`);
                } catch (error) {
                    logger.error(`Error al eliminar la imagen anterior: ${error.message}`);
                }
            }
            await home.destroy({ transaction: t });
            await t.commit();
            res.status(200).json({ msg: 'HomeDeleted' });
        } catch (error) {
            await t.rollback();
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';

            logger.error('HomeController->destroy: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }
};

module.exports = HomeController;
