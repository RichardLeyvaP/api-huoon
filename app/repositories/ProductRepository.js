const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Product, Category } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

const ProductRepository = {
  // Obtener todos los productos
  async findAll() {
    return await Product.findAll({
      attributes: ['id', 'name', 'category_id', 'image'],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    });
  },

  // Buscar un producto por ID
  async findById(id) {
    return await Product.findByPk(id, {
      attributes: ['id', 'name', 'category_id', 'image'],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    });
  },

  // Crear un nuevo producto con manejo de imágenes
  async create(body, file, t) {
    const { name, category_id } = body;
    const product = await Product.create({
      name,
      category_id,
      image: 'products/default.jpg', // Imagen predeterminada
    }, {transaction: t});

    // Manejar archivo si se proporciona
    if (file) {
      const extension = path.extname(file.originalname);
      const newFilename = `products/${product.id}${extension}`;

      try {
        await fs.promises.rename(
          file.path,
          path.join(__dirname, '..', '..', 'public', newFilename)
        );
        await product.update({ image: newFilename }, {transaction: t});
      } catch (err) {
        logger.error(`Error al mover la imagen: ${err.message}`);
        throw err;
      }
    }

    return product;
  },

  // Actualizar un producto con manejo de imágenes
  async update(product, body, file, t) {
    const fieldsToUpdate = ['name', 'category_id', 'image'];

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
        const newFilename = `products/${product.id}${extension}`;

        // Eliminar imagen anterior si no es la predeterminada
        if (product.image && product.image !== 'products/default.jpg') {
          const oldPath = path.join(__dirname, '../../public', product.image);
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
        await product.update(updatedData, {transaction: t}); // Usar la transacción
        logger.info(`Producto actualizado exitosamente (ID: ${product.id})`);
      }

      return product;
    } catch (err) {
      logger.error(`Error en ProductRepository->update: ${err.message}`);
      throw err; // Propagar el error para que el rollback se ejecute
    }
  },

  // Eliminar un producto
  async delete(product) {
    if (product.image && product.image !== 'products/default.jpg') {
      const imagePath = path.join(__dirname, '../../public', product.image);
      await fs.promises.unlink(imagePath).catch(err => logger.error(`Error eliminando la imagen: ${err.message}`));
    }

    return await product.destroy();
  },
};

module.exports = ProductRepository;
