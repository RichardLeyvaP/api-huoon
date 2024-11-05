const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const { Person } = require('../models');  // Importar el modelo Person
const logger = require('../../config/logger');

module.exports = {

    async index(req, res) {
        logger.info(`${req.user.name} - Accediendo a la lista de personas`);

        try {
            // Cargar solo los campos necesarios
            const people = await Person.findAll({
                attributes: ['user_id', 'name', 'birth_date', 'age', 'gender', 'email', 'phone', 'address', 'image'],
            });

            // Mapear los resultados solo si es necesario
            const mappedPeople = people.map(person => {
                return {
                    userId: person.user_id,
                    name: person.name,
                    birthDate: person.birth_date,
                    age: person.age,
                    gender: person.gender,
                    email: person.email,
                    phone: person.phone,
                    address: person.address,
                    image: person.image
                };
            });

            // Devolver los datos sin mapeo si no es necesario transformar los datos
            // res.status(200).json({ people }); 

            // Si hay transformación, devolver los datos mapeados
            res.status(200).json({ people: mappedPeople });

        } catch (error) {
            logger.error('Error en PersonController->index: ' + error.message);
            res.status(500).json({ error: 'ServerError' });
        }
    },
    
    async store(req, res) {
        logger.info(`${req.user.name} - Creando una nueva persona`);
    
        // Validación de los datos
        const schema = Joi.object({
            user_id: Joi.number().required(), // user_id es obligatorio
            name: Joi.string().required(),    // name es obligatorio
            birth_date: Joi.date().optional().allow(null), // nullable
            age: Joi.number().integer().min(0).optional().allow(null), // nullable
            gender: Joi.string().max(10).optional().allow(null), // nullable
            email: Joi.string().email().optional().allow(null), // nullable
            phone: Joi.string().max(15).optional().allow(null), // nullable
            address: Joi.string().max(255).optional().allow(null), // nullable
            image: Joi.any().optional() // opcional, ya que es un archivo
        });
    
        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en PersonController->store: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
    
        try {
            // Procesar la imagen
            let filename = 'people/default.jpg'; // Imagen por defecto
    
            // Crear el registro de la persona
            let person = await Person.create({
                user_id: req.body.user_id,
                name: req.body.name,
                birth_date: req.body.birth_date,
                age: req.body.age,
                gender: req.body.gender,
                email: req.body.email,
                phone: req.body.phone,
                address: req.body.address,
                image: filename, // Imagen por defecto
            });
    
            // Manejo de archivos adjuntos
            if (req.file) {
                // Renombrar la imagen con el ID de la persona
                const extension = path.extname(req.file.originalname);
                const newFilename = `people/${person.id}${extension}`;
    
                // Mover el archivo a la carpeta pública
                const fs = require('fs');
                const oldPath = req.file.path;
                const newPath = `public/${newFilename}`;
    
                fs.rename(oldPath, newPath, async (err) => {
                    if (err) {
                        logger.error('Error al mover la imagen: ' + err.message);
                        return res.status(400).json({ error: 'Error al mover la imagen' });
                    }
    
                    // Actualizar el registro con la ruta del archivo
                    await person.update({ image: newFilename });
                    
                    // Responder con la persona creada
                    return res.status(201).json({
                        msg: 'PersonCreated',
                        person: person
                    });
                });
            } else {
                // Si no hay archivo, responder con la persona creada
                return res.status(201).json({
                    msg: 'PersonCreated',
                    person: person
                });
            }
    
        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error('Error en PersonController->store: ' + errorMsg);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
    
    async show(req, res) {
        logger.info(`${req.user.name} - Accediendo a buscar una persona`);
        // Validación de los datos
        const schema = Joi.object({
            id: Joi.number().required()
        });
    
        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en PeopleController->show: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            // Buscar persona por ID
            // Usar findByPk si estás buscando por clave primaria (id)
            const person = await Person.findByPk(req.body.id);  // findByPk en lugar de findById
            if (!person) {
                return res.status(404).json({ msg: 'PersonNotFound' });
            }
            // Mapear los resultados solo si es necesario
            const mappedPeople = {
                    userId: person.user_id,
                    name: person.name,
                    birthDate: person.birth_date,
                    age: person.age,
                    gender: person.gender,
                    email: person.email,
                    phone: person.phone,
                    address: person.address,
                    image: person.image
                };

            // Devolver los datos sin mapeo si no es necesario transformar los datos
            // res.status(200).json({ people }); 

            // Si hay transformación, devolver los datos mapeados
            res.status(200).json({ people: [mappedPeople] });

        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error('PeopleController->show: ' + errorMsg);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async update(req, res) {
        logger.info(`${req.user.name} - Editando una persona`);
    
        // Validación de los datos con Joi
        const schema = Joi.object({
            id: Joi.number().required(),
            name: Joi.string().max(255).optional(),
            birth_date: Joi.date().optional(),
            age: Joi.number().integer().min(0).allow(null).optional(),
            gender: Joi.string().max(10).allow(null).optional(),
            email: Joi.string().email().max(255).allow(null).optional(),
            phone: Joi.string().max(15).allow(null).optional(),
            address: Joi.string().max(255).allow(null).optional(),
            image: Joi.any().allow(null) // Validación de imagen (Manejo en multer)
        });
    
        const { error } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en PeopleController->update: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
    
        try {
            // Buscar la persona por ID
            const person = await Person.findByPk(req.body.id);
            if (!person) {
                logger.error(`PeopleController->update: Persona no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'PersonNotFound' });
            }
    
            // Lista de campos que pueden ser actualizados
            const fieldsToUpdate = ['name', 'birth_date', 'age', 'gender', 'email', 'phone', 'address'];

            // Filtrar los campos presentes en req.body y construir el objeto updatedData
            const updatedData = Object.keys(req.body)
                .filter(key => fieldsToUpdate.includes(key) && req.body[key] !== undefined)
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});

                // Procesar la imagen si se sube una nueva
                if (req.file) {
                    const fileExtension = path.extname(req.file.originalname);
                    const newFileName = `${person.id}${fileExtension}`;
                    const newImagePath = path.join('public/people', newFileName); // Ruta relativa correcta
                    const oldImagePath = path.join('public/', person.image); // Ajuste en la ruta, sin 'app'

                    // Eliminar la imagen anterior si no es la imagen por defecto
                    if (person.image && person.image !== 'people/default.jpg') {
                        if (fs.existsSync(oldImagePath)) {
                            await fs.promises.unlink(oldImagePath); 
                        }
                    }

                    // Mover la nueva imagen a la carpeta correcta
                    await fs.promises.rename(req.file.path, newImagePath);


                    // Guardar la ruta completa de la nueva imagen en la base de datos
                    updatedData.image = `people/${newFileName}`;
                }
                // Actualizar solo si hay datos que cambiar
                if (Object.keys(updatedData).length > 0) {
                    await person.update(updatedData);
                    logger.info(`Persona actualizada exitosamente: ${person.name} (ID: ${person.id})`);
                }

            res.status(200).json({ msg: 'PersonUpdated', person });
    
        } catch (error) {
            // Capturar errores del bloque try y registrarlos
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error(`PeopleController->update: Error al actualizar la persona: ${errorMsg}`);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando una persona`);
    
        // Validación del ID proporcionado
        const schema = Joi.object({
            id: Joi.number().required()
        });
    
        const { error } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en PeopleController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
    
        try {
            // Buscar la persona por ID
            const person = await Person.findByPk(req.body.id, {
                include: ['user'] // Asegúrate de que 'user' está definido en las relaciones del modelo Person
            });
            if (!person) {
                logger.error(`PeopleController->destroy: Persona no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'PersonNotFound' });
            }
    
            // Verificar si la persona tiene una imagen y no es la imagen predeterminada
            if (person.image && person.image !== 'people/default.jpg') {
                const imagePath = path.join('public/', person.image); // Ajustar la ruta correctamente

                    if (fs.existsSync(imagePath)) {
                        await fs.promises.unlink(imagePath); // Usar promises para un manejo adecuado de errores
                    }
            }    
            // Eliminar la persona de la base de datos
            await person.destroy();
            logger.info(`Persona eliminada exitosamente: ${person.name} (ID: ${person.id})`);
            
            // Eliminar el usuario correspondiente si existe
        if (person.user) {
            logger.info(`Usuario asociado eliminado: ${person.user.name} (ID: ${person.user.id})`);
            await person.user.destroy();
        }
            res.status(200).json({ msg: 'PersonDeleted' });
    
        } catch (error) {
            // Capturar errores del bloque try y registrarlos
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error(`PeopleController->destroy: Error al eliminar la persona: ${errorMsg}`);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }    
};
