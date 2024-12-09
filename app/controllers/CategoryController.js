const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const { Category, sequelize } = require('../models');  // Importar el modelo Category
const logger = require('../../config/logger'); // Importa el logger

const CategoryController = {
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar las categorías`);
    
        try {
            const categories = await Category.findAll({
                where: { parent_id: null },
                include: [
                    {
                        model: Category,
                        as: 'children',
                        include: [
                            {
                                model: Category,
                                as: 'children',
                            }
                        ]
                    }
                ]
            });
    
            const mappedCategories = await Promise.all(
                categories.map(async (category) => ({
                    id: category.id,
                    name: category.name,
                    description: category.description,
                    color: category.color,
                    icon: category.icon,
                    parent_id: category.parent_id,
                    parent: category.parent ? await CategoryController.mapParent(category.parent) : null,
                    children: await CategoryController.mapChildren(category.children) // Llamada explícita
                }))
            );
    
            if (!mappedCategories.length) {
                return res.status(204).json({ msg: 'CategoryNotFound' });
            }
    
            res.status(200).json({ categories: mappedCategories });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
    
            logger.error('CategoryController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async mapParent(parent) {
        return {
            id: parent.id,
            name: parent.name,
            description: parent.description,
            color: parent.color,
            icon: parent.icon,
            parent_id: parent.parent_id,
            parent: parent.parent ? await CategoryController.mapParent(parent.parent) : null // Llamada explícita
        };
    },

    async mapChildren(children) {
        return Promise.all(
            children.map(async (child) => ({
                id: child.id,
                name: child.name,
                description: child.description,
                color: child.color,
                icon: child.icon,
                parent_id: child.parent_id,
                children: await CategoryController.mapChildren(child.children) // Llamada explícita
            }))
        );
    },

    async store(req, res) {
        logger.info(`${req.user.name} - Crea una nueva categoría`);

        const { name, description, color, type, icon, parent_id } = req.body;
        const t = await sequelize.transaction();
        try {
            const category = await Category.create({
                name: name,
                description: description,
                color: color,
                type: type,
                state: 1,
                parent_id: parent_id
            });

            // Manejo del archivo de icono (si se ha subido)
            if (req.file) {
                const extension = path.extname(req.file.originalname);
                const newFilename = `categories/${category.id}${extension}`;
                
                try {
                    // Mover el archivo a la carpeta pública
                    const oldPath = req.file.path;
                    const newPath = path.join(__dirname, '..', '..', 'public', newFilename);
            
                    await fs.promises.rename(oldPath, newPath); // Usa await para esperar hasta que se mueva
            
                    // Actualizar el registro con la ruta del archivo
                    await category.update({ icon: newFilename }, { transaction: t });
                } catch (err) {
                    logger.error('Error al mover el icon: ' + err.message);
                    throw new Error('Error al mover el icono'); // Esto permitirá que el catch lo maneje y haga rollback
                }
            }  else {
                category.icon = icon || "categories/default.jpg";
                await category.save({ transaction: t });
             }
             await t.commit();
            return res.status(201).json({ msg: 'CategoryStoreOk', category });
        } catch (error) {
            await t.rollback();
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('CategoryController->store: ' + errorMsg);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async show(req, res) {
        const categoryId = req.body.id; // Obtén el ID de la categoría desde los parámetros de la solicitud
        logger.info(`${req.user.name} - Entra a buscar la categoría con ID: ${categoryId}`);
    
        try {
            const category = await Category.findOne({
                where: { id: categoryId },
                include: [
                    {
                        model: Category,
                        as: 'parent' // Incluir el padre de la categoría
                    },
                    {
                        model: Category,
                        as: 'children', // Incluir los hijos de la categoría
                        include: [
                            {
                                model: Category,
                                as: 'children' // Incluir los hijos de los hijos
                            }
                        ]
                    }
                ]
            });
    
            // Verifica si se encontró la categoría
            if (!category) {
                return res.status(404).json({ msg: 'CategoryNotFound' });
            }
    
            const mappedCategory = {
                id: category.id,
                name: category.name,
                description: category.description,
                color: category.color,
                icon: category.icon,
                parent_id: category.parent_id,
                parent: category.parent ? await CategoryController.mapParent(category.parent) : null,
                children: await CategoryController.mapChildren(category.children) // Llamada explícita
            };
    
            res.status(200).json({ category: mappedCategory });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
    
            logger.error('CategoryController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async update(req, res) {
        logger.info(`${req.user.name} - Editando una categoría`);
       
        try {
            // Buscar la categoría por ID
            const category = await Category.findByPk(req.body.id);
            if (!category) {
                logger.error(`CategoryController->update: Categoría no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'CategoryNotFound' });
            }
    
            // Lista de campos que pueden ser actualizados
            const fieldsToUpdate = ['name', 'description', 'color', 'parent_id', 'type'];
    
            // Filtrar los campos presentes en req.body y construir el objeto updatedData
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
                const newFilename = `categories/${category.id}${extension}`;

                // Eliminar el icono anterior si existe y no es el predeterminado
                if (category.icon && category.icon !== 'categories/default.jpg') {
                    const oldIconPath = path.join(__dirname, '../../public', category.icon);
                    try {
                        await fs.promises.unlink(oldIconPath);
                        logger.info(`Icono anterior eliminado: ${oldIconPath}`);
                    } catch (error) {
                        logger.error(`Error al eliminar el icono anterior: ${error.message}`);
                    }
                }

                // Mover el nuevo archivo a la carpeta pública
                const newPath = path.join(__dirname, '../../public', newFilename);
                await fs.promises.rename(req.file.path, newPath);
                updatedData.icon = newFilename;

            } else if (typeof req.body.icon === 'string') {
                // Si `icon` es un string, eliminar el icono existente si no es el predeterminado
                if (category.icon && category.icon !== 'categories/default.jpg') {
                    const oldIconPath = path.join(__dirname, '../../public', category.icon);
                    try {
                        await fs.promises.unlink(oldIconPath);
                        logger.info(`Icono anterior eliminado: ${oldIconPath}`);
                    } catch (error) {
                        logger.error(`Error al eliminar el icono anterior: ${error.message}`);
                    }
                }
                updatedData.icon = req.body.icon;
            }
    
            // Actualizar solo si hay datos que cambiar
            if (Object.keys(updatedData).length > 0) {
                await category.update(updatedData);
                logger.info(`Categoría actualizada exitosamente: ${category.name} (ID: ${category.id})`);
            }
    
            res.status(200).json({ msg: 'CategoryUpdated', category });
    
        } catch (error) {
            // Capturar errores del bloque try y registrarlos
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error(`CategoryController->update: Error al actualizar la categoría: ${errorMsg}`);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
    
    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando una categoría`);
    
        try {
            // Buscar la categoría por ID
            const category = await Category.findByPk(req.body.id);
            if (!category) {
                logger.error(`CategoryController->destroy: Categoría no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'CategoryNotFound' });
            }
    
            // Eliminar el ícono anterior si no es el ícono por defecto
            if (category.icon && category.icon !== 'categories/default.jpg') {
                const oldIconPath = path.join(__dirname, '../../public', category.icon);
                try {
                    await fs.promises.unlink(oldIconPath);
                    logger.info(`Icono anterior eliminado: ${oldIconPath}`);
                } catch (error) {
                    logger.error(`Error al eliminar el icono anterior: ${error.message}`);
                }
            }
            // Eliminar la categoría de la base de datos
            await category.destroy();
    
            res.status(200).json({ msg: 'CategoryDeleted' });
    
        } catch (error) {
            // Capturar errores del bloque try y registrarlos
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error(`CategoryController->destroy: Error al eliminar la categoría: ${errorMsg}`);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }
    
    
};

module.exports = CategoryController;
