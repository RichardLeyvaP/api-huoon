const Joi = require('joi');
const { HomePerson, Home, Person, Role, sequelize } = require('../models');
const logger = require('../../config/logger');

// Esquema de validación de Joi
const schema = Joi.object({
    home_id: Joi.number().required(),
    person_id: Joi.number().required(),
    role_id: Joi.number().optional(),
    id: Joi.number().optional(),
});

const assignPeopleSchema = Joi.object({
    home_id: Joi.number().required(),
    people: Joi.array().items(
        Joi.object({
            person_id: Joi.number().required(),
            role_id: Joi.number().required()
        })
    ).required()
});

const HomePersonController = {
    // Obtener todas las relaciones Home-Person
    async index(req, res) {
        logger.info(`${req.user.name} - Busca todas las relaciones Home-Person`);
        try {
            const homePeople = await HomePerson.findAll({
                include: [
                    { model: Home, as: 'home' },
                    { model: Person, as: 'person' },
                    { model: Role, as: 'role' }
                ]
            });

            // Mapeamos los resultados para obtener solo los IDs y nombres
            const mappedhomePeople = homePeople.map(homePerson => ({
                id: homePerson.id,
                homeId: homePerson.home.id,            // ID del hogar
                homeName: homePerson.home.name,        // Nombre del hogar
                personId: homePerson.person.id,        // ID de la persona
                personName: homePerson.person.name,    // Nombre de la persona
                roleId: homePerson.role.id,            // ID del rol
                roleName: homePerson.role.name         // Nombre del rol
            }));

            res.status(200).json({ 'homePeople': mappedhomePeople });
        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            logger.error('HomePersonController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Crear una nueva relación Home-Person
    async store(req, res) {
        logger.info(`${req.user.name} - Crea una nueva relación Home-Person`);

        const { error, value } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en HomePersonController->store: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

        try {
            const homePerson = await HomePerson.create(value);
            res.status(201).json({ msg: 'HomePersonCreated', homePerson });
        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            logger.error('HomePersonController->store: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Obtener una relación específica Home-Person por ID
    async show(req, res) {
        logger.info(`${req.user.name} - Busca la relación Home-Person con ID: ${req.body.id}`);

        // Validación de los datos con Joi
        const schema = Joi.object({
            id: Joi.number().required()
        });
    
        const { error } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en HomePersonController->show: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const homePerson = await HomePerson.findByPk(req.body.id, {
                include: [
                    { model: Home, as: 'home' },
                    { model: Person, as: 'person' },
                    { model: Role, as: 'role' }
                ]
            });
            if (!homePerson) {
                return res.status(404).json({ msg: 'HomePersonNotFound' });
            }

            // Mapeamos los resultados para obtener solo los IDs y nombres
            const mappedhomePeople = {
                id: homePerson.id,
                homeId: homePerson.home.id,            // ID del hogar
                homeName: homePerson.home.name,        // Nombre del hogar
                personId: homePerson.person.id,        // ID de la persona
                personName: homePerson.person.name,    // Nombre de la persona
                roleId: homePerson.role.id,            // ID del rol
                roleName: homePerson.role.name         // Nombre del rol
            };
            res.status(200).json({ 'homePeople': [mappedhomePeople] });
        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            logger.error('HomePersonController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Actualizar una relación Home-Person
    async update(req, res) {
        logger.info(`${req.user.name} - Editando una relación Home-Person`);

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en HomePersonController->update: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const homePerson = await HomePerson.findByPk(req.body.id);
            if (!homePerson) {
                logger.error(`HomePersonController->update: Relación no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'HomePersonNotFound' });
            }

            await homePerson.update(req.body);
            res.status(200).json({ msg: 'HomePersonUpdated', homePerson });
        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            logger.error('HomePersonController->update: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Eliminar una relación Home-Person
    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando una relación Home-Person`);

        try {
            const homePerson = await HomePerson.findByPk(req.params.id);
            if (!homePerson) {
                logger.error(`HomePersonController->destroy: Relación no encontrada con ID ${req.params.id}`);
                return res.status(404).json({ msg: 'HomePersonNotFound' });
            }

            await homePerson.destroy();
            res.status(200).json({ msg: 'HomePersonDeleted' });
        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            logger.error('HomePersonController->destroy: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async assignPeopleToHome(req, res) {
        // Validar los datos de entrada con Joi
        const { error, value } = assignPeopleSchema.validate(req.body);
        
        if (error) {
            logger.error(`Error de validación en assignPeopleToHome: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

        const { home_id, people } = value; // Extraer valores validados

        try {
            const home = await Home.findByPk(home_id);
            if (!home) {
                logger.error(`assignPeopleToHome: No se encontró un hogar con ID ${home_id}`);
                return res.status(404).json({ error: 'HomeNotFound' });
            }

            // Crear o actualizar las relaciones en la tabla pivote
            const associations = people.map(async (person) => {
                const { person_id, role_id } = person;

                // Verificar si la persona existe
                const personInstance = await Person.findByPk(person_id);
                if (!personInstance) {
                    logger.error(`assignPeopleToHome: No se encontró una persona con ID ${person_id}`);
                    return res.status(404).json({ error: `PersonNotFound: ID ${person_id}` });
                }

                // Verificar si la persona existe
                const roleInstance = await Role.findByPk(role_id);
                if (!roleInstance) {
                    logger.error(`assignPeopleToHome: No se encontró un rol con ID ${role_id}`);
                    return res.status(404).json({ error: `PersonNotFound: ID ${role_id}` });
                }

                // Crear o actualizar la asociación en la tabla pivote
                await HomePerson.upsert({
                    home_id: home_id,
                    person_id: person_id,
                    role_id: role_id,
                });
            });

            // Esperar a que todas las asociaciones se completen
            await Promise.all(associations);

            res.status(200).json({ msg: 'PeopleAssignedToHome' });
        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            logger.error('HomePersonController->assignPeopleToHome: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
};

module.exports = HomePersonController;
