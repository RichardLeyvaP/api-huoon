// controllers/productController.js
const Joi = require('joi');
const { Op } = require('sequelize');
const { Product, Status, Category } = require('../models'); // Importar el modelo Product
const path = require('path');
const fs = require('fs');
const logger = require('../../config/logger'); // Importa el logger

// Esquema de validación de Joi
const schema = Joi.object({
    name: Joi.string().max(255).optional(),
    category_id: Joi.number().integer().optional(),
    image: Joi.string()
    .pattern(/\.(jpg|jpeg|png|gif)$/i)  // Validar formato de imagen
    .allow(null) // Permite que sea nulo (opcional)
    .optional()  // Hace que sea opcional
    .messages({
        'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif)',
    }),
    id: Joi.number().optional(),
});

const ProductController = {
    // Obtener todos los productos
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar los productos`);

        try {
            const products = await Product.findAll();
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

        const { error, value } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en ProductController->store: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(detail => detail.message) });
        }

        try {
            let filename = 'products/default.jpg'; // Imagen por defecto
            const product = await Product.create({
                name: value.name,
                category_id: value.category_id,
                image: filename
            });

            // Manejo del archivo de icono (si se ha subido)
            if (req.file) {
                const extension = path.extname(req.file.originalname);
                const newFilename = `products/${product.id}${extension}`;
                
                try {
                    // Mover el archivo a la carpeta pública
                    const oldPath = req.file.path;
                    const newPath = path.join(__dirname, '..', '..', 'public', newFilename);
            
                    await fs.promises.rename(oldPath, newPath); // Usa await para esperar hasta que se mueva
            
                    // Actualizar el registro con la ruta del archivo
                    await product.update({ image: newFilename });
                } catch (err) {
                    logger.error('Error al mover la imagen: ' + err.message);
                    throw new Error('Error al mover la imagen'); // Esto permitirá que el catch lo maneje y haga rollback
                }
            }
            res.status(201).json({ msg: 'ProductCreated', product });
        } catch (error) {
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
            const product = await Product.findByPk(req.body.id);
            if (!product) {
                return res.status(404).json({ msg: 'ProductNotFound' });
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

        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en ProductController->update: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const product = await Product.findByPk(req.body.id);
            if (!product) {
                logger.error(`ProductController->update: Producto no encontrado con ID ${req.params.id}`);
                return res.status(404).json({ msg: 'ProductNotFound' });
            }

            // Lista de campos que pueden ser actualizados
            const fieldsToUpdate = ['name', 'category_id'];

            // Construir el objeto updatedData con los campos presentes en req.body
            const updatedData = Object.keys(req.body)
                .filter(key => fieldsToUpdate.includes(key) && req.body[key] !== undefined)
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});

            // Procesar la actualización del icono
                if (req.file) {
                    // Si se envía un archivo nuevo
                    const extension = path.extname(req.file.originalname);
                    const newFilename = `products/${product.id}${extension}`;

                    // Eliminar el icono anterior si existe y no es el predeterminado
                    if (product.image !== 'products/default.jpg') {
                        const oldIconPath = path.join(__dirname, '../../public', product.image);
                        try {
                            await fs.promises.unlink(oldIconPath);
                            logger.info(`Imagen anterior eliminada: ${oldIconPath}`);
                        } catch (error) {
                            logger.error(`Error al eliminar la imagen anterior: ${error.message}`);
                        }
                    }

                    // Mover el nuevo archivo a la carpeta pública
                    const newPath = path.join(__dirname, '../../public', newFilename);
                    await fs.promises.rename(req.file.path, newPath);
                    updatedData.image = newFilename;

                }
             // Actualizar solo si hay datos que cambiar
             if (Object.keys(updatedData).length > 0) {
                await product.update(updatedData);
                logger.info(`Producto actualizado exitosamente: ${product.name} (ID: ${product.id})`);
            }

            res.status(200).json({ msg: 'ProductUpdated', product });
        } catch (error) {
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

        const schema = Joi.object({
            id: Joi.number().required()
        });
    
        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en ProductController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const product = await Product.findByPk(req.body.id);
            if (!product) {
                logger.error(`ProductController->destroy: Producto no encontrado con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'ProductNotFound' });
            }

            if (product.image && product.image !== 'products/default.jpg') {
                const oldIconPath = path.join(__dirname, '../../public', product.image);
                try {
                    await fs.promises.unlink(oldIconPath);
                    logger.info(`Imagen anterior eliminada: ${oldIconPath}`);
                } catch (error) {
                    logger.error(`Error al eliminar la imagen anterior: ${error.message}`);
                }
            }

            await product.destroy();
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
             return res.status(404).json({ error: 'Persona no encontrada' });
         }
        try {
           const categories = await ProductController.getCategories(personId);
           const statuses = await ProductController.getStatus();
   
            res.json({
                productcategories: categories,
                productstatus: statuses,
            });
        } catch (error) {
            logger.error('Error al obtener categorías:', error);
            res.status(500).json({ error: 'Error al obtener categorías' });
        }
    },

    async getCategories(personId){
        logger.info('Entra a Buscar Las categories en (category_status_priority)');
        try {
            // Obtén las categorías relacionadas con la persona o con state = 1
            const categories = await Category.findAll({
                where: {
                    type: 'Product',
                    [Op.or]: [
                        { state: 1 },
                        { '$people.id$': personId } // Filtra por la relación en la tabla intermedia
                    ]
                },
                include: [
                    {
                        association: 'people', // Incluye la relación
                        required: false // Esto permite que devuelva categorías sin relación con personas
                    },
                    { association: 'children' }
                ]
            });
    
            // Llama a mapChildrenCategory usando `this`
            const transformedCategories = await Promise.all(categories.map(async category => {
                const children = category.children.length > 0 ? await ProductController.mapChildrenCategory(category.children) : [];
                return {
                    id: category.id,
                    nameCategory: category.name,
                    descriptionCategory: category.description,
                    colorCategory: category.color,
                    iconCategory: category.icon,
                    parent_id: category.parent_id,
                    children: children
                };
            }));
    
            return transformedCategories;
        } catch (error) {
            logger.error('Error al obtener categorías desde getCategories:', error);
            throw new Error('Error al obtener categorías'); // Lanza el error para manejarlo en el controlador principal
        }
    },
    async mapChildrenCategory(children) {
        return Promise.all(
            children.map(async (child) => {
                const childChildren = child.children.length > 0 ? await ProductController.mapChildrenCategory(child.children) : [];
                return {
                    id: child.id,
                    name: child.name,
                    description: child.description,
                    color: child.color,
                    icon: child.icon,
                    parent_id: child.parent_id,
                    children: childChildren
                };
            })
        );
    },
    async getStatus() {
        logger.info('Entra a Buscar Los estados en (category_status_priority)');
        try {
            const statuses = await Status.findAll({
                where: { type: 'Product' }
            });
    
            return statuses.map(status => {
                return {
                    id: status.id,
                    nameStatus: status.name,
                    descriptionStatus: status.description,
                    colorStatus: status.color,
                    iconStatus: status.icon
                };
            });
        } catch (error) {
            logger.error('Error en getStatus:', error);
            throw new Error('Error al obtener estados');
        }
    },
};

module.exports = ProductController;
