const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Category, sequelize } = require('../models');
const logger = require('../../config/logger'); // Logger para seguimiento

const CategoryRepository = {
  // Obtener todas las categorías jerárquicas
  async findAll() {
    const categories = await Category.findAll({
      //where: { parent_id: null },
      include: [
        {
          model: Category,
          as: 'parent', // Incluir el padre de la categoría
        },
        {
          model: Category,
          as: 'children',
          include: [
            {
              model: Category,
              as: 'children',
            },
          ],
        },
      ],
    });

    return Promise.all(
      categories.map(async (category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        type: category.type,
        parent_id: category.parent_id,
        parent: category.parent ? await this.mapParent(category.parent) : null,
        children: await this.mapChildren(category.children),
      }))
    );
  },

  async findById(id) {
    return await Category.findOne({
      where: { id },
      include: [
        {
          model: Category,
          as: 'parent', // Incluir el padre de la categoría
        },
        {
          model: Category,
          as: 'children', // Incluir los hijos de la categoría
          include: [
            {
              model: Category,
              as: 'children', // Incluir los hijos de los hijos
            },
          ],
        },
      ],
    });
  },
  

  async mapParent(parent) {
    return {
      id: parent.id,
      name: parent.name,
      description: parent.description,
      color: parent.color,
      icon: parent.icon,
      typr: parent.type,
      parent_id: parent.parent_id,
      parent: parent.parent ? await this.mapParent(parent.parent) : null,
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
        children: await this.mapChildren(child.children),
      }))
    );
  },

  // Buscar si existe una categoría por nombre, excluyendo una categoría específica
  async existsByName(name, excludeId = null) {
    const whereCondition = excludeId ? { name, id: { [Op.ne]: excludeId } } : { name };
    return await Category.findOne({ where: whereCondition });
  },

  // Crear una nueva categoría con manejo de imágenes
  async create(body, file) {
    let { name, description, color, type, icon, parent_id } = body;
    // Validar y corregir parent_id si es inválido o vacío
    if (parent_id === '' || parent_id === null || !Number.isInteger(Number(parent_id))) {
        parent_id = null; // Asignar null si el valor no es un entero válido
    }
    // Inicia la transacción
    const t = await sequelize.transaction();
    try {
        // Crear la categoría
        const category = await Category.create(
            {
                name,
                description,
                color,
                type,
                parent_id,
                state: 1, // Estado por defecto
            },
            { transaction: t }
        );

        // Manejar el archivo de icono (si existe)
        if (file) {
            const extension = path.extname(file.originalname);
            const newFilename = `categories/${category.id}${extension}`;
            
            const newPath = path.join(__dirname, '..', '..', 'public', newFilename);
            await fs.promises.rename(file.path, newPath); // Mover el archivo

            await category.update({ icon: newFilename }, { transaction: t });
        } else {
            category.icon = icon || 'categories/default.jpg';
            await category.save({ transaction: t });
        }

        // Confirmar transacción
        await t.commit();
        return category;
    } catch (error) {
        await t.rollback();
        logger.error(`Error al crear la categoría: ${error.message}`);
        throw new Error(error.message);
    }
  },

  // Actualizar una categoría con manejo de imágenes
  async update(category, body, file) {
    const { name, description, color, type, icon, parent_id } = body;
    const fieldsToUpdate = ['name', 'description', 'color', 'type', 'parent_id'];

        // Validar y corregir parent_id si es inválido o vacío
      if (parent_id === '' || parent_id === null || !Number.isInteger(Number(parent_id))) {
          body.parent_id = null; // Asignar null si el valor no es un entero válido
      }

    const updatedData = Object.keys(body)
        .filter((key) => fieldsToUpdate.includes(key) && body[key] !== undefined)
        .reduce((obj, key) => {
            obj[key] = body[key];
            return obj;
        }, {});

    // Verificar si se va a actualizar el icono
    if (file) {
        const extension = path.extname(file.originalname);
        const newFilename = `categories/${category.id}${extension}`;

        // Verificar si el icono anterior existe antes de eliminarlo
        if (category.icon && category.icon !== 'categories/default.jpg') {
            const oldIconPath = path.join(__dirname, '../../public', category.icon);
            
            try {
              if (fs.existsSync(oldIconPath)) {
                await fs.promises.unlink(oldIconPath);
                logger.info(`Icono anterior eliminado: ${oldIconPath}`);
            }
            } catch (error) {
                if (error.code === 'ENOENT') {
                    logger.warn(`El icono anterior no existe: ${oldIconPath}`);
                } else {
                    logger.error(`Error al eliminar el icono anterior: ${error.message}`);
                    throw new Error('Error al eliminar el icono anterior');
                }
            }
        }

        // Mover el nuevo archivo a la carpeta pública
        const newPath = path.join(__dirname, '../../public', newFilename);
        await fs.promises.rename(file.path, newPath);
        updatedData.icon = newFilename;
    } else if (icon && typeof icon === 'string') {
        // Si el icono es una URL o nombre, actualizarlo
        if (category.icon && category.icon !== 'categories/default.jpg') {
            const oldIconPath = path.join(__dirname, '../../public', category.icon);
            
            try {
              if (fs.existsSync(oldIconPath)) {
                await fs.promises.unlink(oldIconPath);
                logger.info(`Icono anterior eliminado: ${oldIconPath}`);
            }
            } catch (error) {
                if (error.code === 'ENOENT') {
                    logger.warning(`El icono anterior no existe: ${oldIconPath}`);
                } else {
                    logger.error(`Error al eliminar el icono anterior: ${error.message}`);
                    throw new Error('Error al eliminar el icono anterior');
                }
            }
        }
        updatedData.icon = icon;
    }

    if (Object.keys(updatedData).length > 0) {
        await category.update(updatedData);
        logger.info(`Categoría actualizada exitosamente: ${category.name} (ID: ${category.id})`);
    }

    return category;
  },

  // Eliminar una categoría con manejo de imágenes
  async delete(category) {
    if (category.icon && category.icon !== 'categories/default.jpg') {
        const imagePath = path.join(__dirname, '../../public', category.icon);
        
        try {
          if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
            logger.info(`Icono anterior eliminado: ${imagePath}`);
        }
        } catch (err) {
            if (err.code === 'ENOENT') {
                // Si el archivo no existe, solo mostrar advertencia
                logger.warning(`El icono no existe: ${imagePath}`);
            } else {
                // Si hubo otro error, registrar el error
                logger.error(`Error eliminando la imagen: ${err.message}`);
                throw new Error(`Error al eliminar la imagen: ${err.message}`);
            }
        }
    }
    logger.info(`Categoría eliminada exitosamente: ${category.id}`);
    // Eliminar la categoría de la base de datos
    return await category.destroy();
  },
};

module.exports = CategoryRepository;
