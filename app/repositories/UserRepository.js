const { User, sequelize } = require('../models');
const bcrypt = require('bcrypt');
const authConfig = require('../../config/auth');
const logger = require('../../config/logger'); // Logger para seguimiento

class UserRepository {
    async findAll() {
        return await User.findAll();
    }

    async findById(id) {
        return await User.findByPk(id);
    }

    async create(body, t) {
        try{
        let hashedPassword = bcrypt.hashSync(body.password, Number.parseInt(authConfig.rounds));
        const extractedName = body.user ? body.user : body.email.split('@')[0];
        // Crear el usuario con la contraseña encriptada
        const user = await User.create({
        name: extractedName,
        email: body.email,
        password: hashedPassword,
        language: body.language || 'es' // Asigna 'es' si no se proporciona language
        }, { transaction: t });
        return user;
    } catch (err) {
        logger.error(`Error en UserRepository->store: ${err.message}`);
        throw err; // Propagar el error para que el rollback se ejecute
    }
    }

    async update(user, body, t) {
        try{
        // Lista de campos que pueden ser actualizados
            const fieldsToUpdate = ['name', 'email', 'language'];

            // Filtrar los campos presentes en req.body y construir el objeto updatedData
            const updatedData = Object.keys(body)
            .filter(key => fieldsToUpdate.includes(key) && body[key] !== undefined)
            .reduce((obj, key) => {
                obj[key] = body[key];
                return obj;
            }, {});

            // Actualizar solo si hay datos que cambiar
            if (Object.keys(updatedData).length > 0) {
            await user.update(updatedData, {transaction:t });
            logger.info(`Usuario actualizado exitosamente: ${user.name} (ID: ${user.id})`);
            }

            return user;
        } catch (err) {
            logger.error(`Error en PersonRepository->update: ${err.message}`);
            throw err; // Propagar el error para que el rollback se ejecute
        }
    }

    async delete(user) {
        return await user.destroy();
    }
}

module.exports = new UserRepository();
