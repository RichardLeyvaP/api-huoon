const { Op } = require('sequelize');
const Joi = require('joi');
const { User, Person, UserToken, sequelize } = require('../models'); // Importamos sequelize desde db
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth');
const logger = require('../../config/logger');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment'); // Usamos moment.js para facilitar el manejo de fechas
// Esquema de validación para el registro de usuario

const schema = Joi.object({
    name: Joi.string().min(3).required(), // nombre entre 3 y 30 caracteres
    user: Joi.string().min(3).optional(), // nombre entre 3 y 30 caracteres
    email: Joi.string().email().required(),       // email válido y obligatorio
    password: Joi.string().min(5).required(),     // contraseña de al menos 6 caracteres
    language: Joi.string().valid('es', 'en', 'pt').default('es') // 'es' por defecto, acepta solo los valores 'es', 'en', 'fr'
  });

  // Definir el esquema de validación
    const updatePasswordSchema = Joi.object({
        id: Joi.number().integer().required().messages({
            'any.required': 'El ID del usuario es obligatorio.',
            'number.base': 'El ID del usuario debe ser un número.',
            'number.integer': 'El ID del usuario debe ser un entero.',
        }),
        currentPassword: Joi.string().allow('').messages({
            'string.base': 'La contraseña actual debe ser un texto.',
        }),
        newPassword: Joi.string().min(8).required().messages({
            'any.required': 'La nueva contraseña es obligatoria.',
            'string.min': 'La nueva contraseña debe tener al menos 8 caracteres.',
        }),
    });

  const AuthController = {
    //login
    async login(req, res) {
        logger.info('Entrando a loguearse');
        try {
            const user = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: req.body.email },  // Puede ser el correo
                        { name: req.body.email }   // O puede ser el nombre de usuario
                    ]
                },
                include: [
                    {
                        model: Person,
                        as: 'person'
                    }
                ]
            });
            if (!user) {
                return res.status(400).json({ msg: 'Credenciales inválidas' });
            }
            // Verificar si el campo password es nulo o vacío
            if (!user.password || user.password === '') {
                return res.status(400).json({ msg: 'Credenciales inválidas' });
            }
    
            const isMatch = await bcrypt.compare(req.body.password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Credenciales inválidas' });
            }
            
            // Extraemos los datos de 'person' del usuario
            const person = user.person ? {
                id: user.person.id,
                name: user.person.name,
                email: user.person.email,
                image: user.person.image
            } : null;

            // Construimos el objeto del usuario con la estructura deseada
            const userNew = {
                id: user.id,                     // ID del usuario
                email: user.email,               // Correo del usuario
                name: user.name,                 // Nombre del usuario
                language: user.language,         // Idioma del usuario
                person: person                   // Datos de 'person'
            };

            // Creamos el token con el objeto estructurado
            const token = jwt.sign({user: userNew}, authConfig.secret, {
                expiresIn: authConfig.expires // Tiempo de expiración del token
            });
            // Decodificar el token para obtener la fecha de expiración
            const decoded = jwt.decode(token);

            // La fecha de expiración está en el campo 'exp' del JWT
            const expiresAt = new Date(decoded.exp * 1000); // 'exp' es en segundos, así que lo convertimos a milisegundos

             // Guardar el token en la base de datos
            await UserToken.create({
                user_id: user.id,
                token: token,
                expires_at: expiresAt
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
                personEmail: user.person.email,
                personImage: user.person.image
            });
        } catch (err) {
            logger.error('Error al loguear usuario: ' + err.message);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    },

    async loginApk(req, res) {
        logger.info('Entrando a loguearse desde la aplicación');
        
        try {
            const user = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: req.body.email },  // Puede ser el correo
                        { name: req.body.email }   // O puede ser el nombre de usuario
                    ]
                },
                include: [
                    {
                        model: Person,
                        as: 'person'
                    }
                ]
            });
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

            // Extraemos los datos de 'person' del usuario
            const person = user.person ? {
                id: user.person.id,
                name: user.person.name,
                email: user.person.email,
                image: user.person.image
            } : null;

            // Construimos el objeto del usuario con la estructura deseada
            const userNew = {
                id: user.id,                     // ID del usuario
                email: user.email,               // Correo del usuario
                name: user.name,                 // Nombre del usuario
                language: user.language,         // Idioma del usuario
                person: person                   // Datos de 'person'
            };

            // Creamos el token con el objeto estructurado
            const token = jwt.sign({user: userNew}, authConfig.secret, {
                expiresIn: authConfig.expires // Tiempo de expiración del token
            });

             // Decodificar el token para obtener la fecha de expiración
            const decoded = jwt.decode(token);

            // La fecha de expiración está en el campo 'exp' del JWT
            const expiresAt = new Date(decoded.exp * 1000); // 'exp' es en segundos, así que lo convertimos a milisegundos

             // Guardar el token en la base de datos
            await UserToken.create({
                user_id: user.id,
                token: token,
                expires_at: expiresAt
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
                personEmail: user.person.email,
                personImage: user.person.image
            });
        } catch (err) {
            logger.error('Error al loguear usuario: ' + err.message);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    },

    //registro
    async register(req, res){
        logger.info('Registrando Usuario.');

        const t = await sequelize.transaction(); // Inicia una transacción
        try {
            // Generar un hashSync de la contraseña
            let hashedPassword = bcrypt.hashSync(req.body.password, Number.parseInt(authConfig.rounds));
            const extractedName = req.body.user ? req.body.user : req.body.email.split('@')[0];
            // Crear el usuario con la contraseña encriptada
            const user = await User.create({
            name: extractedName,
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

            // Decodificar el token para obtener la fecha de expiración
            const decoded = jwt.decode(token);

            // La fecha de expiración está en el campo 'exp' del JWT
            const expiresAt = new Date(decoded.exp * 1000); // 'exp' es en segundos, así que lo convertimos a milisegundos

             // Guardar el token en la base de datos
            await UserToken.create({
                user_id: user.id,
                token: token,
                expires_at: expiresAt
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
                personEmail: userNew.person.email,
                personImage: person.image
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
          }else{            
          person = user.person;
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

        // Decodificar el token para obtener la fecha de expiración
        const decoded = jwt.decode(token);

        // La fecha de expiración está en el campo 'exp' del JWT
        const expiresAt = new Date(decoded.exp * 1000); // 'exp' es en segundos, así que lo convertimos a milisegundos

         // Guardar el token en la base de datos
        await UserToken.create({
            user_id: user.id,
            token: token,
            expires_at: expiresAt
        });
        // Confirma la transacción
        await transaction.commit();
        // Respuesta en formato JSON

        const userData = {
            id: userNew.id,
            userName: userNew.name,
            email: userNew.email,
            language: userNew.language,
            token: token,
            personId: userNew.person.id,
            personName: userNew.person.name,
            personEmail: userNew.person.email,
            personImage: person.image
        };
        
        const userDataString = encodeURIComponent(JSON.stringify(userData));
        return res.redirect(`http://localhost:3000?user=${userDataString}`);
    
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            logger.error('Error en googleCallback:', error);
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
            }else{            
                person = user.person;
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

            // Decodificar el token para obtener la fecha de expiración
            const decoded = jwt.decode(token);

            // La fecha de expiración está en el campo 'exp' del JWT
            const expiresAt = new Date(decoded.exp * 1000); // 'exp' es en segundos, así que lo convertimos a milisegundos

             // Guardar el token en la base de datos
            await UserToken.create({
                user_id: user.id,
                token: token,
                expires_at: expiresAt
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
                personEmail: userNew.person.email,
                personImage: person.image
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
    },

    async logout(req, res) {
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Obtener el token del encabezado Authorization

        if (!token) {
            return res.status(400).json({ msg: 'No token proporcionado' });
        }

        // Marcar el token como revocado directamente en la base de datos
        const [updated] = await UserToken.update(
            { revoked: true },
            { where: { token }, returning: true }
        );

        if (updated === 0) {
            return res.status(400).json({ msg: 'Token no encontrado o ya revocado' });
        }

        // Responder al cliente
        res.status(200).json({ msg: 'Logout exitoso' });
    } catch (err) {
        logger.error('Error al hacer logout: ' + err.message);
        res.status(500).json({ error: 'Error en el servidor' });
    }
    },

    async updatePassword(req, res) {
        logger.info(`${req.user.name} - Actualiza la contraseña del userID ${req.body.id}`);
        try {

            const { id, currentPassword, newPassword } = req.body;
    
            // Verificar que el usuario existe
            const user = await User.findByPk(id);
    
            if (!user) {
                return res.status(400).json({ msg: 'Usuario no encontrado' });
            }
    
            // Verificar si el usuario está vinculado a un proveedor externo
            if (user.external_id && user.external_auth) {
                // Si ya tiene una contraseña configurada, validarla
                if (user.password) {
                    const passwordMatch = bcrypt.compareSync(currentPassword, user.password);
    
                    if (!passwordMatch) {
                        return res.status(400).json({ msg: 'La contraseña actual no es correcta.' });
                    }
                }
            } else {
                // Validar la contraseña actual para cuentas estándar
                const passwordMatch = bcrypt.compareSync(currentPassword, user.password);
    
                if (!passwordMatch) {
                    return res.status(400).json({ msg: 'La contraseña actual no es correcta.' });
                }
            }
    
            // Encriptar la nueva contraseña
            const hashedNewPassword = bcrypt.hashSync(newPassword, Number.parseInt(authConfig.rounds));
    
            // Actualizar la contraseña
            await user.update({ password: hashedNewPassword });
    
            res.status(200).json({ msg: 'Contraseña actualizada correctamente.' });
        } catch (err) {
            logger.error('Error al actualizar la contraseña: ' + err.message);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    }
    
}
module.exports = AuthController;