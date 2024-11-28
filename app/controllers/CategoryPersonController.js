const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const { CategoryPerson, Category, Person, sequelize  } = require('../models');  // Importar el modelo Category
const logger = require('../../config/logger'); // Importa el logger
 
  // Esquema de validación de Joi
    const schema = Joi.object({
        name: Joi.string().max(255).optional(),
        description: Joi.string().allow(null, ''),
        color: Joi.string().allow(null, ''),
        type: Joi.string().allow(null, ''), // Asegúrate de que este campo esté permitido
        icon: Joi.alternatives().try(
            Joi.string(),
            Joi.object({
                mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/jpg', 'image/gif').required(),
                size: Joi.number().max(2048 * 1024).required()
            })
        ).allow(null),
        parent_id: Joi.number().integer().allow(null),
        id: Joi.number().optional(),
    });

    const CategoryPersonController = {
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a buscar las categorías asociadas`);
    
        try {
            // Obtener el ID de la persona relacionada con el usuario autenticado
             // Obtener la persona asociada al usuario autenticado usando el método findByUserId en Person
            const person = await Person.findByUserId(req.user.id);
            if (!person) {
                return res.status(404).json({ msg: 'PersonNotFound' });
            }
            const personId = person.id; // Suponiendo que `personId` es accesible desde `req.user`
    
            // Obtener todas las categorías que estén relacionadas con la persona
            const categories = await Category.findAll({
                include: [
                    {
                        model: Category,
                        as: 'parent',
                    },
                    {
                        model: Category,
                        as: 'children',
                        include: [{ model: Category, as: 'children' }],
                    },
                    {
                        model: Person,
                        as: 'people',
                        where: { id: personId },
                        required: false, // Dejar que se incluyan también categorías con state = 1
                    }
                ]
            });
    
            // Filtrar y mapear las categorías
            const mappedCategories = await Promise.all(
                categories
                    .filter(category => category.people.length > 0 || category.state === 1)
                    .map(async (category) => {
                        return {
                            id: category.id,
                            name: category.name,
                            description: category.description,
                            color: category.color,
                            icon: category.icon,
                            state: category.state,
                            parent_id: category.parent_id,
                            children: await CategoryPersonController.mapChildren(category.children || [], personId),
                        };
                    })
            );
    
            if (!mappedCategories.length) {
                return res.status(204).json({ msg: 'CategoryNotFound' });
            }
    
            res.status(200).json({ categories: mappedCategories });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
    
            logger.error(`CategoryController->index: ${errorMsg}`);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
    
    async mapChildren(children, personId) {
        // Filtrar solo los hijos que estén relacionados con la persona o tengan `state = 1`
        const filteredChildren = children.filter(child => {
            return (
                child.people.some(person => person.id === personId) || 
                child.state === 1
            );
        });
    
        // Mapear los hijos filtrados
        return Promise.all(
            filteredChildren.map(async (child) => {    
                return {
                    id: child.id,
                    name: child.name,
                    description: child.description,
                    color: child.color,
                    icon: child.icon,
                    state: child.state,
                    parent_id: child.parent_id,
                    children: await CategoryPersonController.mapChildren(child.children || [], personId) // Recursividad
                };
            })
        );
    },

    async store(req, res) {
        logger.info(`${req.user.name} - Crea una nueva categoría asociada a la persona`);
        
        // Validación de datos de entrada con Joi
        const { error, value } = schema.validate({
            ...req.body,
            icon: req.file ? { mimetype: req.file.mimetype, size: req.file.size } : req.body.icon
        });
        if (error) {
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }        
        const t = await sequelize.transaction();
        try {
            let filename = 'categories/default.jpg'; // Imagen por defecto
            // Obtener la instancia completa de Person
            const person = await Person.findByPk(req.user.person.id);
            const category = await Category.create({
                name: value.name,
                description: value.description,
                color: value.color,
                type: value.type,
                state: 0,
                parent_id: value.parent_id || null,
                person_id: person.id,
            }, { transaction: t });

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
                category.icon = value.icon || "categories/default.jpg";
                await category.save({ transaction: t });
             }

            // Relacionar la categoría con la persona
            await person.addCategory(category, { transaction: t });
            await t.commit();
            res.status(201).json({ msg: 'Categoría creada exitosamente', category });
        } catch (error) {
            await t.rollback();
            const errorMsg = error.message || 'Error desconocido';
            logger.error(`CategoryController->store: ${errorMsg}`);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async update(req, res) {
        logger.info(`${req.user.name} - Editando una categoría de la persona`);

        // Validación de los datos con Joi
        const { error } = schema.validate({
            ...req.body,
            icon: req.file ? { mimetype: req.file.mimetype, size: req.file.size } : req.body.icon
        });

        if (error) {
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
        const t = await sequelize.transaction();

        try {
            // Buscar la categoría por ID
            const categoryPerson = await CategoryPerson.findByPk(req.body.id);
            if (!categoryPerson) {
                return res.status(404).json({ error: 'CategoryPerson not found' });
            }

            // Usar `category_id` para encontrar la categoría real en `categories`
            const category = await Category.findByPk(categoryPerson.category_id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            // Lista de campos que pueden ser actualizados
            const fieldsToUpdate = ['name', 'description', 'color', 'parent_id', 'type'];

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

            // Actualizar solo si hay cambios
            if (Object.keys(updatedData).length > 0) {
                await category.update(updatedData, { transaction: t });
                logger.info(`Categoría actualizada exitosamente: ${category.name} (ID: ${category.id})`);
            }

            await t.commit();
            res.status(200).json({ msg: 'CategoryPersonUpdated', category });
        } catch (error) {
            await t.rollback();
            const errorMsg = error.message || 'Error desconocido';
            logger.error(`CategoryPersonController->update: Error al actualizar la categoría: ${errorMsg}`);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async show(req, res) {
        logger.info(`${req.user.name} - Consultando una categoría específica`);

        // Validar el parámetro ID en los parámetros de la ruta
        const schema = Joi.object({
            id: Joi.number().required()
        });
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const personId = req.person.id;

            // Buscar la categoría por ID e incluir las relaciones necesarias
            const category = await Category.findByPk(req.body.id, {
                include: [
                    { model: Category, as: 'parent' }, // Relación con la categoría padre
                    { 
                        model: Category, 
                        as: 'children', 
                        include: [{ model: Category, as: 'children' }] // Relación recursiva con hijos
                    },
                    {
                        model: Person,
                        as: 'people',
                        where: { id: personId },
                        required: false, // Dejar que se incluyan también categorías con state = 1
                    }
                ]
            });

            // Validar si la categoría existe
            if (!category) {
                logger.error(`CategoryController->show: Categoría no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'CategoryNotFound' });
            }

            // Filtrar y estructurar los datos de la categoría y sus hijos
            const formattedCategory = {
                id: category.id,
                name: category.name,
                description: category.description,
                color: category.color,
                icon: category.icon,
                state: category.state,
                parent_id: category.parent_id,
                children: await CategoryPersonController.mapChildren(category.children || [], personId)
            };

            res.status(200).json({ category: formattedCategory });

        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            logger.error(`CategoryController->show: ${errorMsg}`);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando una categoría de la tabla category_person`);
     
        const { error } = schema.validate(req.body);
    
        if (error) {
            logger.error(`Error de validación en CategoryPersonController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }
        try {
            // Buscar la categoría por ID en la tabla category_person
            const categoryPerson = await CategoryPerson.findByPk(req.body.id);
            if (!categoryPerson) {
                logger.error(`CategoryPersonController->destroy: CategoryPerson no encontrada con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'CategoryPersonNotFound' });
            }
    
            // Buscar la categoría asociada para verificar el estado
            const category = await Category.findByPk(categoryPerson.category_id); // Asumiendo que categoryId es la clave foránea en category_person
            if (!category) {
                logger.error(`CategoryPersonController->destroy: Categoría asociada no encontrada con ID ${categoryPerson.category_id}`);
                return res.status(404).json({ msg: 'CategoryNotFound' });
            }            
            // Eliminar la categoría de category_person
            await categoryPerson.destroy();
    
            // Verificar si el estado de la categoría es 0
            if (category.state === 0) {
               
                if (category.icon && category.icon !== 'categories/default.jpg') {
                    const oldIconPath = path.join(__dirname, '../../public', category.icon);
                    try {
                        await fs.promises.unlink(oldIconPath);
                        logger.info(`Icono anterior eliminado: ${oldIconPath}`);
                    } catch (error) {
                        logger.error(`Error al eliminar el icono anterior: ${error.message}`);
                    }
                }

            await category.destroy();
            }
    
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

module.exports = CategoryPersonController;
