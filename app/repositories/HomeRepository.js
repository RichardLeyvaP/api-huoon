const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const i18n = require('../../config/i18n-config');
const { Home, HomeType, Status } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

const HomeRepository = {
  // Obtener todas las casas
  async findAll() {
    return await Home.findAll({
      attributes: ['id', 'name', 'address', 'geo_location', 'timezone', 'image', 'residents', 'home_type_id', 'status_id'],
      include: [
        {
          model: HomeType,
          as: 'homeType',
          attributes: ['id', 'name'],
        },
        {
          model: Status,
          as: 'status',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });
  },

  // Buscar una casa por ID
  async findById(id) {
    return await Home.findByPk(id, {
      attributes: ['id', 'name', 'address', 'geo_location', 'timezone', 'image', 'residents', 'home_type_id', 'status_id'],
      include: [
        {
          model: HomeType,
          as: 'homeType',
          attributes: ['id', 'name'],
        },
        {
          model: Status,
          as: 'status',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });
  },

  // Crear una nueva casa con manejo de imágenes
  async create(body, file, transaction) {
    const { name, address, geo_location, timezone, residents, home_type_id, status_id } = body;
    const home = await Home.create({
      name,
      address,
      geo_location,
      timezone,
      residents,
      home_type_id,
      status_id,
      image: 'homes/default.jpg', // Imagen predeterminada
    }, { transaction } );

    // Manejar archivo si se proporciona
    if (file) {
      const extension = path.extname(file.originalname);
      const newFilename = `homes/${home.id}${extension}`;

      try {
        await fs.promises.rename(
          file.path,
          path.join(__dirname, '..', '..', 'public', newFilename)
        );
        await home.update({ image: newFilename });
      } catch (err) {
        logger.error(`Error al mover la imagen: ${err.message}`);
        throw new Error('Error al mover la imagen');
      }
    }

    return home;
  },

  // Actualizar una casa con manejo de imágenes
  async update(home, body, file, transaction) {
    const fieldsToUpdate = ['name', 'address', 'geo_location', 'timezone', 'residents', 'home_type_id', 'status_id', 'image'];

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
            const newFilename = `homes/${home.id}${extension}`;

            // Eliminar imagen anterior si no es la predeterminada
            if (home.image && home.image !== 'homes/default.jpg') {
                const oldPath = path.join(__dirname, '../../public', home.image);
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
            await home.update(updatedData, { transaction }); // Usar la transacción
            logger.info(`Casa actualizada exitosamente (ID: ${home.id})`);
        }

        return home;
    } catch (err) {
        logger.error(`Error en HomeRepository->update: ${err.message}`);
        throw err; // Propagar el error para que el rollback se ejecute
    }
  },

  // Eliminar una casa
  async delete(home) {
    if (home.image && home.image !== 'homes/default.jpg') {
      const imagePath = path.join(__dirname, '../../public', home.image);
      await fs.promises.unlink(imagePath).catch(err => logger.error(`Error eliminando la imagen: ${err.message}`));
    }

    return await home.destroy();
  },
};

module.exports = HomeRepository;
