const path = require('path');
const fs = require('fs');
const { Person, User, sequelize } = require('../models');  // Importar el modelo Person
const logger = require('../../config/logger');
const bcrypt = require('bcrypt');
const authConfig = require('../../config/auth');
const { PersonRepository, UserRepository } = require('../repositories');

module.exports = {

    async index(req, res) {
        logger.info(`${req.user.name} - Accediendo a la lista de personas`);

        try {
            // Cargar solo los campos necesarios
            const people = await PersonRepository.findAll();

            // Mapear los resultados solo si es necesario
            const mappedPeople = people.map(person => {
                return {
                    id: person.id,
                    userId: person.user_id,
                    name: person.name,
                    user: person.user.name,
                    language: person.user.language,
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
        logger.info('datos recibidos al crear una persona');
        logger.info(JSON.stringify(req.body));

        let user;
        if (req.body.user_id !== undefined) {
            user = await UserRepository.findById(req.body.user_id);
            if (!user) {
                logger.error(`PersonController->store: Usuario no encontrado con ID ${req.body.user_id}`);
                return res.status(204).json({ msg: 'UserNotFound' });
            }
        }
        // Iniciar una transacción
        const t = await sequelize.transaction();
        try {
            if (!user) {
                logger.info('PersonController->store: Creando nuevo usuario');
                user = await UserRepository.create(req.body, t);
            }
           const person = await PersonRepository.create(req.body, req.file, user, t);
            
            // Confirmar la transacción
            await t.commit();
                // Si no hay archivo, responder con la persona creada
                return res.status(201).json({
                    msg: 'PersonCreated',
                    person: person
                });
    
        } catch (error) {
            await t.rollback();
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error('Error en PersonController->store: ' + errorMsg);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
    
    async show(req, res) {
        logger.info(`${req.user.name} - Accediendo a buscar una persona`);
        
        try {
            // Buscar persona por ID
            // Usar findByPk si estás buscando por clave primaria (id)
            const person = await PersonRepository.findById(req.body.id);  // findByPk en lugar de findById
            if (!person) {
                return res.status(404).json({ msg: 'PersonNotFound' });
            }
            // Mapear los resultados solo si es necesario
            const mappedPeople = {
                    id:person.id,
                    userId: person.user_id,
                    name: person.name,
                    user: person.user.name,
                    language: person.user.name,
                    birthDate: person.birth_date,
                    age: person.age,
                    gender: person.gender,
                    email: person.email,
                    phone: person.phone,
                    address: person.address,
                    image: person.image
                };

            // Si hay transformación, devolver los datos mapeados
            res.status(200).json({ people: mappedPeople });

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
        logger.info('datos recibidos al editar una persona');
        logger.info(JSON.stringify(req.body));
        
        // Buscar la persona por ID
        const person = await PersonRepository.findById(req.body.id);
        if (!person) {
            logger.error(`PeopleController->update: Persona no encontrada con ID ${req.body.id}`);
            return res.status(404).json({ msg: 'PersonNotFound' });
        }
        
        let userData;
        if (req.body.user_id) {
            userData = await UserRepository.findById(req.body.user_id);
            if (!userData) {
                logger.error(`PersonController->store: Usuario no encontrado con ID ${req.body.user_id}`);
                return res.status(204).json({ msg: 'UserNotFound' });
            }
        }else{
            userData = await UserRepository.findById(person.user_id);
        }

    // Iniciar una transacción
        const t = await sequelize.transaction();
       try {

        if (req.body.user || req.body.email || req.body.language) {
            logger.info('PersonController->update: editando el usuario');
            const body = {};
            if (req.body.user) body.name = req.body.user;
            if (req.body.language) body.language = req.body.language;
            if (req.body.email) body.email = req.body.email;
            const userDataUpdate = await UserRepository.update(userData, body, t);        
        }
            const personUpdate = await PersonRepository.update(person, req.body, req.file, t);
                // Confirmar la transacción
            await t.commit();
            res.status(200).json({ msg: 'PersonUpdated', personUpdate });
    
        } catch (error) {
            await t.rollback();
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
        
        try {
            // Buscar la persona por ID
            const person = await PersonRepository.findById(req.body.id);
            if (!person) {
                logger.error(`PeopleController->destroy: Persona no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'PersonNotFound' });
            }
    
            logger.info(`Persona eliminada exitosamente: ${person.name} (ID: ${person.id})`);
            const personDelete = await PersonRepository.delete(person);
            // Eliminar el usuario correspondiente si existe
        if (person.user) {
            logger.info(`Usuario asociado eliminado: ${person.user.name} (ID: ${person.user.id})`);
            const userDelete = await UserRepository.destroy(person.user);
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
