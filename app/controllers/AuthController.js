const Joi = require('joi');
const { User, Person, sequelize } = require('../models'); // Importamos sequelize desde db
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth');
const logger = require('../../config/logger');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
// Esquema de validación para el registro de usuario

const schema = Joi.object({
    name: Joi.string().min(3).required(), // nombre entre 3 y 30 caracteres
    user: Joi.string().min(3).optional(), // nombre entre 3 y 30 caracteres
    email: Joi.string().email().required(),       // email válido y obligatorio
    password: Joi.string().min(5).required(),     // contraseña de al menos 6 caracteres
    language: Joi.string().valid('es', 'en', 'pt').default('es') // 'es' por defecto, acepta solo los valores 'es', 'en', 'fr'
  });

  const AuthController = {
    //login
    async login(req, res) {
        logger.info('Entrando a loguearse');
        
        // Validación de entrada
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        });
        
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
    
        try {
            const user = await User.findOne({ where: { email: req.body.email },
                include: [{ model: Person, as: 'person' }]  }); // Incluir la relación `person`
            if (!user) {
                return res.status(401).json({ msg: 'Credenciales inválidas' });
            }
            // Verificar si el campo password es nulo o vacío
            if (!user.password || user.password === '') {
                return res.status(401).json({ msg: 'Credenciales inválidas' });
            }
    
            const isMatch = await bcrypt.compare(req.body.password, user.password);
            if (!isMatch) {
                return res.status(401).json({ msg: 'Credenciales inválidas' });
            }
            // Creamos el token
            const token = jwt.sign({ user: user}, authConfig.secret, {
                expiresIn: authConfig.expires
            });
    
            // Respuesta exitosa
            res.status(201).json({
                id: user.id,
                userName: user.name,
                email: user.email,
                language: user.language,
                token: token,
                personId: user.person.id,
                personName: user.person.name,
                personEmail: user.person.email
            });
        } catch (err) {
            logger.error('Error al loguear usuario: ' + err.message);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    },

    async loginApk(req, res) {
        logger.info('Entrando a loguearse desde la aplicación');
        
        // Validación de entrada
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        });
        
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
    
        try {
            const user = await User.findOne({ where: { email: req.body.email },
                include: [{ model: Person, as: 'person' }]  });
            if (!user) {
                return res.status(401).json({ msg: 'Credenciales inválidas' });
            }
            if (!user.password || user.password === '') {
                return res.status(401).json({ msg: 'Credenciales inválidas' }); 
            }
    
            const isMatch = await bcrypt.compare(req.body.password, user.password);
            if (!isMatch) {
                return res.status(401).json({ msg: 'Credenciales inválidas' });
            }
    
            // Creamos el token
            const token = jwt.sign({ user: user}, authConfig.secret, {
                expiresIn: authConfig.expires
            });
    
            // Respuesta exitosa
            res.status(201).json({
                id: user.id,
                userName: user.name,
                email: user.email,
                language: user.language,
                token: token,
                personId: user.person.id,
                personName: user.person.name,
                personEmail: user.person.email
            });
        } catch (err) {
            logger.error('Error al loguear usuario: ' + err.message);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    },

    //registro
    async register(req, res){
        logger.info('Registrando Usuario.');

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en AuthController->register: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
        const t = await sequelize.transaction(); // Inicia una transacción
        try {
            // Generar un hashSync de la contraseña
            let hashedPassword = bcrypt.hashSync(req.body.password, Number.parseInt(authConfig.rounds));
        
            // Crear el usuario con la contraseña encriptada
            const user = await User.create({
            name: req.body.user || req.body.email,
            email: req.body.email,
            password: hashedPassword,
            language: req.body.language || 'es' // Asigna 'es' si no se proporciona language
            }, { transaction: t });


            // Crear la persona asociada al usuario dentro de la misma transacción
            const person = await Person.create({
                user_id: user.id,
                name: req.body.name,
                email: req.body.email,
                image: 'people/default.jpg'
            }, { transaction: t });

        // Hacer commit de la transacción
        await t.commit();
            
            // Creamos el objeto con la información del usuario y la persona
            const userNew = {
                id: user.id,
                email: user.email,
                name: person.name,
                language: user.language,
                person: {
                    id: person.id, // Aquí accedes a la persona creada
                    name: person.name,
                    email: person.email
                }
            };
            // Creamos el token
            const token = jwt.sign({ user: userNew}, authConfig.secret, {
                expiresIn: authConfig.expires
            });
            // Respuesta en formato JSON
            res.status(201).json({
                id: userNew.id,
                userName: userNew.name,
                email: userNew.email,
                language: userNew.language,
                token: token,
                personId: userNew.person.id,
                personName: userNew.person.name,
                personEmail: userNew.person.email
            });
        } catch (err) {
            // Revertir la transacción en caso de error
            await t.rollback();
            logger.error('Error al registrar usuario: ' + err.message);
            res.status(500).json({ error: err.message });
        }
    },
    
    async googleCallback(req, res, profile){
        const transaction = await sequelize.transaction();
        try {
            const { id, name, email, image } = profile;
            const extractedName = email.split('@')[0];
          // Busca al usuario en la base de datos usando el id de Google
          let user = await User.findOne({ 
            where: { 
                external_id: id, 
                external_auth: 'google' 
            },
            include: [{ model: Person, as: 'person' }],
            transaction
        });
           let person = []; // Definimos `person` aquí para que esté accesible en todo el bloque
        if (!user) {
            // Si no existe un usuario con `external_id`, busca por correo electrónico
            user = await User.findOne({ 
                where: { 
                    email: email
                },
                include: [{ model: Person, as: 'person' }],
                transaction
            });
    
            if (user) {
                person = user.person;
                if (image && person.image == 'people/default.jpg') {
                    const savedImagePath = await AuthController.saveImageFromUrl(image, id);
                    await person.update({ image: savedImagePath }, { transaction });
                }
              // Actualiza el usuario si ya existe por correo
              await User.update({
                external_id: id, 
                external_auth: 'google', 
                name: name 
            }, {
                where: { id: user.id } // Asegúrate de especificar el usuario que deseas actualizar
            }, { transaction });
            } else {
              // Crea un nuevo usuario si no existe ni por `external_id` ni por correo
              user = await User.create({
                name: extractedName,
                email: email,
                external_id: id,
                external_auth: 'google' // Guardamos la URL de la imagen
            }, { transaction });
            console.log('Usuario creado con ID:', user.id);
    
              // Crea la persona relacionada
              person = await Person.create({
                user_id: user.id,
                name: name,
                email: email,
                image: 'people/default.jpg'
            }, { transaction });
            console.log('Person creado con ID:', person.id);


            // Guarda la imagen desde la URL, si está disponible
            if (image) {
                const savedImagePath = await this.saveImageFromUrl(image, id);
                await person.update({ image: savedImagePath }, { transaction });
            }
            }
          }    
          const userNew = {
            id: user.id,
            email: user.email,
            name: user.name,
            language: user.language,
            person: {
                id: person.id, // Aquí accedes a la persona creada
                name: person.name,
                email: person.email
            }
        };
        // Creamos el token
        const token = jwt.sign({ user: userNew}, authConfig.secret, {
            expiresIn: authConfig.expires
        });
        // Confirma la transacción
        await transaction.commit();
        // Respuesta en formato JSON
        res.status(201).json({
            id: userNew.id,
            userName: userNew.name,
            email: userNew.email,
            language: userNew.language,
            token: token,
            personId: userNew.person.id,
            personName: userNew.person.name,
            personEmail: userNew.person.email
        });
    
        } catch (error) {
            await transaction.rollback();
            console.error('Error en googleCallback:', error);
            return res.status(500).json({ error: 'ServerError' });
        }
    },   
    
    async facebookCallback(req, res, profile) {
        const transaction = await sequelize.transaction();
        try {
            const { id, name, email } = profile; // Extrae la información básica del perfil de Facebook
            
            // Busca al usuario en la base de datos usando el ID de Facebook
            let user = await User.findOne({ 
                where: { 
                    external_id: id, 
                    external_auth: 'facebook' 
                },
                include: [{ model: Person, as: 'person' }],
                transaction
            });
               let person = []; // Definimos `person` aquí para que esté accesible en todo el bloque
            if (!user) {
                // Si no existe un usuario con `external_id`, busca por correo electrónico
                user = await User.findOne({ 
                    where: { 
                        email: email 
                    },
                    include: [{ model: Person, as: 'person' }],
                    transaction
                });
    
                if (user) {
                    person = user.person;
                     // Guarda la imagen desde la URL, si está disponible
                     if (image && person.image == 'people/default.jpg') {
                        const savedImagePath = await AuthController.saveImageFromUrl(image, id);
                        await person.update({ image: savedImagePath }, { transaction });
                    }
                    // Actualiza el usuario si ya existe por correo
                    await User.update({
                        external_id: id, 
                        external_auth: 'facebook', 
                        name: name 
                    }, {
                        where: { id: user.id } // Asegúrate de especificar el usuario que deseas actualizar
                    }, { transaction });
                } else {
                    // Crea un nuevo usuario si no existe ni por `external_id` ni por correo
                    user = await User.create({
                        name: name,
                        email: email,
                        external_id: id,
                        external_auth: 'facebook'
                    }, { transaction });
    
                    // Crea la persona relacionada
                    person = await Person.create({
                        user_id: user.id,
                        name: name,
                        email: email,
                        image: 'people/default.jpg'
                    }, { transaction });

                    // Guarda la imagen desde la URL, si está disponible
            if (image) {
                const savedImagePath = await this.saveImageFromUrl(image, id);
                await person.update({ image: savedImagePath }, { transaction });
            }
                }
            }
              
              const userNew = {
                id: user.id,
                email: user.email,
                name: user.name,
                language: user.language,
                person: {
                    id: person.id, // Aquí accedes a la persona creada
                    name: person.name,
                    email: person.email
                }
            };
            // Creamos el token
            const token = jwt.sign({ user: userNew}, authConfig.secret, {
                expiresIn: authConfig.expires
            });
            
            await transaction.commit();
            // Respuesta en formato JSON
            res.status(201).json({
                id: userNew.id,
                userName: userNew.name,
                email: userNew.email,
                language: userNew.language,
                token: token,
                personId: userNew.person.id,
                personName: userNew.person.name,
                personEmail: userNew.person.email
            });
    
        } catch (error) {
            await transaction.commit();
            console.error('Error en facebookCallback:', error);
            return res.status(500).json({ error: 'ServerError' });
        }
    },

    // Método para descargar y guardar la imagen de perfil
    async saveImageFromUrl(imageUrl, personId) {
        try {
            const response = await axios({
                url: imageUrl,
                method: 'GET',
                responseType: 'stream'
            });

            const extension = path.extname(imageUrl) || '.jpg';
            const newFileName = `${personId}${extension}`;
            const imagePath = path.join('public/people', newFileName);

            // Guardar la imagen en el servidor
            const writer = fs.createWriteStream(imagePath);
            response.data.pipe(writer);

            // Esperar a que la imagen termine de guardarse
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            return `people/${newFileName}`; // Ruta relativa que se guardará en la base de datos

        } catch (error) {
            console.error('Error al descargar la imagen:', error);
            return 'people/default.jpg'; // Retorna la imagen por defecto en caso de fallo
        }
    }
}
module.exports = AuthController;