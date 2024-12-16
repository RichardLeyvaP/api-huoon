const path = require('path');
const fs = require('fs');
const { Person, User, sequelize } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

class PersonRepository {
    async findAll() {
        return await Person.findAll({
            attributes: ['id', 'user_id', 'name', 'birth_date', 'age', 'gender', 'email', 'phone', 'address', 'image'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'language'],
                },
            ],
        });
    }

    async findById(id) {
        return await Person.findByPk(id, {
            attributes: ['id', 'user_id', 'name', 'birth_date', 'age', 'gender', 'email', 'phone', 'address', 'image'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'language'],
                },
            ],
        });
    }

    async create(body, file, user, t) {
    
        try {
         // Crear el registro de la persona
         let person = await Person.create({
             user_id: user.id,
             name: body.name,
             birth_date: body.birth_date,
             age: body.age,
             gender: body.gender,
             email: body.email,
             phone: body.phone,
             address: body.address,
             image: 'people/default.jpg', // Imagen por defecto
         }, { transaction: t });
 
         // Manejo de archivos adjuntos
         if (file) {
            const extension = path.extname(file.originalname);
            const newFilename = `people/${person.id}${extension}`;
            
            const newPath = path.join(__dirname, '..', '..', 'public', newFilename);
            await fs.promises.rename(file.path, newPath); // Mover el archivo

            await person.update({ image: newFilename }, { transaction: t });
        }
        return person;
    } catch (err) {
        logger.error(`Error en PersonRepository->store: ${err.message}`);
        throw err; // Propagar el error para que el rollback se ejecute
    }
    }

    async update(person, body, file, t) {
        // Lista de campos que pueden ser actualizados
        const fieldsToUpdate = ['name', 'birth_date', 'age', 'gender', 'email', 'phone', 'address', 'user_id'];
  
        const updatedData = Object.keys(body)
      .filter(key => fieldsToUpdate.includes(key) && body[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

      try {
        // Manejar el archivo si se proporciona
        if (file) {
            const extension = path.extname(file.originalname);
            const newFilename = `people/${person.id}${extension}`;

            // Eliminar imagen anterior si no es la predeterminada
            if (person.image && person.image !== 'people/default.jpg') {
                const oldPath = path.join(__dirname, '../../public', person.image);
                await fs.promises.unlink(oldPath).catch(err =>
                    logger.error(`Error eliminando la imagen anterior: ${err.message}`)
                );
            }

            const newPath = path.join(__dirname, '../../public', newFilename);
            await fs.promises.rename(file.path, newPath);
            updatedData.image = newFilename;
        }

        // Actualizar los datos en la base de datos si hay cambios
        if (Object.keys(updatedData).length > 0) {
            await person.update(updatedData, { transaction: t }); // Usar la transacción
            logger.info(`Persona actualizada exitosamente (ID: ${person.id})`);
        }

        return person;
    } catch (err) {
        logger.error(`Error en PersonRepository->update: ${err.message}`);
        throw err; // Propagar el error para que el rollback se ejecute
    }
    }

    async delete(person) {
        if (person.image && person.image !== 'people/default.jpg') {
            const imagePath = path.join(__dirname, '../../public', person.image);
            await fs.promises.unlink(imagePath).catch(err => logger.error(`Error eliminando la imagen: ${err.message}`));
          }
      
          return await person.destroy();
    }
}

module.exports = new PersonRepository();
