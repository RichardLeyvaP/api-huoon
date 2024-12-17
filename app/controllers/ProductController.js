// controllers/productController.js
const Joi = require('joi');
const { Op } = require('sequelize');
const { Product, Status, Category } = require('../models'); // Importar el modelo Product
const path = require('path');
const fs = require('fs');
const logger = require('../../config/logger'); // Importa el logger
const i18n = require('../../config/i18n-config');
const { CategoryService, StatusService } = require('../services');
const ProductRepository = require('../repositories/ProductRepository');

const ProductController = {
    // Obtener todos los productos
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar los productos`);

        try {
            const products = await ProductRepository.findAll();
            res.status(200).json({ 'products': products });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('ProductController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Crear un nuevo producto
    async store(req, res) {
        logger.info(`${req.user.name} - Crea un nuevo producto`);
        const t = await sequelize.transaction();
        try {
            const product = await ProductRepository.create(req.body, req.file, t);
             // Confirmar la transacción
             await t.commit();
            res.status(201).json({ msg: 'ProductCreated', product });
        } catch (error) {
             // Hacer rollback en caso de error
             if (!t.finished) {
                await t.rollback();
            }
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('ProductController->store: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Obtener un producto por ID
    async show(req, res) {
        logger.info(`${req.user.name} - Entra a buscar el producto con ID: ${req.body.id}`);

        try {
            const product = await ProductRepository.findById(req.body.id);
            if (!product) {
                return res.status(400).json({ msg: 'ProductNotFound' });
            }
            res.status(200).json({ 'product': product });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('ProductController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Actualizar un producto
    async update(req, res) {
        logger.info(`${req.user.name} - Editando un producto`);
        const t = await sequelize.transaction();
        try {
            const product = await ProductRepository.findById(req.body.id);
            if (!product) {
                logger.error(`ProductController->update: Producto no encontrado con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'ProductNotFound' });
            }

            const productUpdate = await ProductRepository.update(product, req.body, req.file, t);
            await t.commit();
            res.status(200).json({ msg: 'ProductUpdated', productUpdate });
        } catch (error) { 
            // Hacer rollback en caso de error
            if (!t.finished) {
               await t.rollback();
           }
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('ProductController->update: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Eliminar un producto
    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando un producto`);

        try {
            const product = await ProductRepository.findById(req.body.id);
            if (!product) {
                logger.error(`ProductController->destroy: Producto no encontrado con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'ProductNotFound' });
            }

            const productDelete = await ProductRepository.delete(product);
            res.status(200).json({ msg: 'ProductDeleted' });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('ProductController->destroy: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    //Ruta unificada de Mantenedores
    async category_status(req, res){
        logger.info(`${req.user.name} - Entra a la ruta unificada de Products`);

         // Obtén el ID de la persona autenticada
         const personId = req.person.id;
            
         if (!personId) {
             return res.status(400).json({ error: 'Persona no encontrada' });
         }
        try {
           const categories = await CategoryService.getCategories(personId, "Product");
           const statuses = await StatusService.getStatus("Product");
   
            res.json({
                productcategories: categories,
                productstatus: statuses,
            });
        } catch (error) {
            logger.error('Error al obtener categorías:', error);
            res.status(500).json({ error: 'Error al obtener categorías' });
        }
    },
};

module.exports = ProductController;
