// services/CategoryService.js

const { Op } = require('sequelize');
const { Category } = require('../models'); // Importa tus modelos
const logger = require('../../config/logger'); // Importa el logger
const i18n = require('../../config/i18n-config');

class CategoryService {
  // Método para obtener categorías
  static async getCategories(personId, type){
    logger.info(`Entra a Buscar Las categorias de ${type}`);
    try {
        // Obtén las categorías relacionadas con la persona o con state = 1
        const categories = await Category.findAll({
            where: {
                type: type,
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
            const children = category.children.length > 0 ? await CategoryService.mapChildrenCategory(category.children) : [];
            const translatedName = category.state === 1 ? i18n.__(`category.${category.name}.name`) : category.name;
            const translatedDescription = category.state === 1 ? i18n.__(`category.${category.name}.description`) : category.description;
            return {
                id: category.id,
                nameCategory: translatedName,
                descriptionCategory: translatedDescription,
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
}

  // Método para mapear los hijos de las categorías
  static async mapChildrenCategory(children) {
    return Promise.all(
        children.map(async (child) => {
            const childChildren = child.children.length > 0 ? await CategoryService.mapChildrenCategory(child.children) : [];
            const translatedName = child.state === 1 ? i18n.__(`category.${child.name}.name`) : child.name;  // Traduce el nombre
            const translatedDescription = child.state === 1 ? i18n.__(`category.${child.name}.description`) : child.description;  // Traduce la descripción
            return {
                id: child.id,
                name: translatedName,
                description: translatedDescription,
                color: child.color,
                icon: child.icon,
                parent_id: child.parent_id,
                children: childChildren
            };
        })
    );
}
}

    module.exports = CategoryService;
