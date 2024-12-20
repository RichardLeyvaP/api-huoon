const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const { Category, sequelize } = require('../models');  // Importar el modelo Category
const logger = require('../../config/logger'); // Importa el logger
const { CategoryRepository } = require('../repositories');

const CategoryController = {
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar las categorías`);
    
        try {
            const categories = await CategoryRepository.findAll();    
    
            if (!categories.length) {
                return res.status(204).json({ msg: 'CategoryNotFound' });
            }
    
            res.status(200).json({ categories: categories });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
    
            logger.error('CategoryController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    /*async mapParent(parent) {
        return {
            id: parent.id,
            name: parent.name,
            description: parent.description,
            color: parent.color,
            icon: parent.icon,
            type: parent.type,
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
                type: child.type,
                parent_id: child.parent_id,
                children: await CategoryController.mapChildren(child.children) // Llamada explícita
            }))
        );
    },*/

    async store(req, res) {
        logger.info(`${req.user.name} - Crea una nueva categoría`);
        logger.info('datos recibidos al crear una categoría');
        logger.info(JSON.stringify(req.body));
        
        const { parent_id } = req.body;

        if (parent_id) {
            const parentId = await CategoryRepository.findById(parent_id);
             if (!parentId) {
                 logger.error(`CategoryController->store: Categoría no encontrada con ID ${parent_id}`);
                 return res.status(404).json({ msg: 'CategoryNotFound' });
             }            
        }

        try {
            const category = await CategoryRepository.create(req.body, req.file);
            return res.status(201).json({ msg: 'CategoryStoreOk', category });
        } catch (error) {
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

            const category = await CategoryRepository.findById(categoryId);

            if (!category.length) {
                return res.status(204).json({ msg: 'CategoryNotFound' });
            }
    
            res.status(200).json({ category: category });
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
        logger.info('datos recibidos al editar una categoría');
        logger.info(JSON.stringify(req.body));
       
        try {
            // Buscar la categoría por ID
            const category = await CategoryRepository.findById(req.body.id);
            if (!category) {
                logger.error(`CategoryController->update: Categoría no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'CategoryNotFound' });
            }
    
            const categoryUpdate = await CategoryRepository.update(category, req.body, req.file);
    
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
            const category = await CategoryRepository.findById(req.body.id);
            if (!category) {
                logger.error(`CategoryController->destroy: Categoría no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'CategoryNotFound' });
            }
    
            const categoryDelete = await CategoryRepository.delete(category);
    
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
