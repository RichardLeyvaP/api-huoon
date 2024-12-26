const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Product, Category } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento
const ImageService = require('../services/ImageService');

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
      const newFilename = ImageService.generateFilename('products', product.id, file.originalname);
      product.image = await ImageService.copyFile(file, newFilename);
      await product.update({ image: product.image }, { transaction: t});
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
        if (product.icon && product.image !== 'products/default.jpg') {
          await ImageService.deleteFile(product.image);
        }
        const newFilename = ImageService.generateFilename('products', product.id, file.originalname);
        updatedData.image = await ImageService.copyFile(file, newFilename);
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
      await ImageService.deleteFile(product.image);
    }

    return await product.destroy();
  },
};

module.exports = ProductRepository;
