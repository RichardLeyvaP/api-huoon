const path = require('path');
const fs = require('fs');
const { Finance, User, sequelize } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento
const { Op } = require('sequelize');

class FinanceRepository {
    async findAll() {
        return await Finance.findAll({
            attributes: ['id', 'home_id', 'person_id', 'spent', 'income', 'date', 'description', 'type', 'method', 'image'],
        });
    }

    async findAllType(id, home_id = null, type) {

        const whereConditions = {};
        // Según el tipo, establecer el campo correcto para la consulta
    if (type === 'Hogar') {        
        whereConditions.type = type;
        whereConditions.home_id = id;  // Si el tipo es 'Hogar', usa home_id
      } else if (type === 'Personal') {
        whereConditions.type = type;
        whereConditions.person_id = id;  // Si el tipo es 'Persona', usa person_id
      }
      else{
        whereConditions[Op.or] = [
            { person_id: id },      // Si el person_id es igual al parámetro
            { home_id: home_id }    // O si el home_id es igual al parámetro
        ];
      }
        return await Finance.findAll({
            where: whereConditions,
            attributes: ['id', 'home_id', 'person_id', 'spent', 'income', 'date', 'description', 'type', 'method', 'image'],
        });
    }

    async findById(id) {
        return await Finance.findByPk(id, {
            attributes: ['id', 'home_id', 'person_id', 'spent', 'income', 'date', 'description', 'type', 'method', 'image']
        });
    }

    async create(body, file, t) {
        try {
            // Crear el registro financiero
            let finance = await Finance.create({
                home_id: body.home_id,
                person_id: body.person_id,
                spent: body.spent,
                income: body.income,
                date: body.date,
                description: body.description,
                type: body.type,
                method: body.method,
                image: 'finances/default.jpg', // Imagen por defecto
            }, { transaction: t });

            // Manejo de archivos adjuntos
            if (file) {
                const extension = path.extname(file.originalname);
                const newFilename = `finances/${finance.id}${extension}`;

                const newPath = path.join(__dirname, '..', '..', 'public', newFilename);
                await fs.promises.rename(file.path, newPath); // Mover el archivo

                await finance.update({ image: newFilename }, { transaction: t });
            }
            return finance;
        } catch (err) {
            logger.error(`Error en FinanceRepository->create: ${err.message}`);
            throw err; // Propagar el error para que el rollback se ejecute
        }
    }

    async update(finance, body, file, t) {
        // Lista de campos que pueden ser actualizados
        const fieldsToUpdate = ['home_id', 'person_id', 'spent', 'income', 'date', 'description', 'type', 'method'];

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
                const newFilename = `finances/${finance.id}${extension}`;

                // Eliminar imagen anterior si no es la predeterminada
                if (finance.image && finance.image !== 'finances/default.jpg') {
                    const oldPath = path.join(__dirname, '../../public', finance.image);
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
                await finance.update(updatedData, { transaction: t }); // Usar la transacción
                logger.info(`Registro financiero actualizado exitosamente (ID: ${finance.id})`);
            }

            return finance;
        } catch (err) {
            logger.error(`Error en FinanceRepository->update: ${err.message}`);
            throw err; // Propagar el error para que el rollback se ejecute
        }
    }

    async delete(finance) {
        if (finance.image && finance.image !== 'finances/default.jpg') {
            const imagePath = path.join(__dirname, '../../public', finance.image);
            await fs.promises.unlink(imagePath).catch(err => logger.error(`Error eliminando la imagen: ${err.message}`));
        }

        return await finance.destroy();
    }
}

module.exports = new FinanceRepository();
