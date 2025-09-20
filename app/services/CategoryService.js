// services/CategoryService.js

const { Op } = require("sequelize");
const { Category } = require("../models"); // Importa tus modelos
const logger = require("../../config/logger"); // Importa el logger
const i18n = require("../../config/i18n-config");

class CategoryService {
  // Método para obtener categorías
  static async getCategories(personId, type) {
  logger.info(`Entra a Buscar Las categorias de ${type}`);
  try {
    const allCategories = await Category.findAll({
      where: {
        type: type,
        [Op.or]: [
          { state: 1 },
          { "$people.id$": personId },
        ],
      },
      include: [
        {
          association: "people",
          required: false,
          attributes: ["id"],
        },
        {
          association: "children",
          required: false,
          include: [
            {
              association: "children",
              required: false,
              include: [
                { association: "children", required: false },
              ],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });

    const plainCategories = allCategories.map(cat => {
      const plain = cat.toJSON();
      plain.children = plain.children || [];
      return plain;
    });

    // 🔹 Paso clave: Flattening con indentación
    const flatList = [];

    const addToFlatList = (category, level = 0) => {
      const indent = "　".repeat(level); // Espacio en blanco (Unicode) para indentación visual

      const translatedName = category.state === 1
        ? i18n.__(`category.${category.name}.name`) !== `category.${category.name}.name`
          ? i18n.__(`category.${category.name}.name`)
          : category.name
        : category.name;

      const translatedDescription = category.state === 1
        ? i18n.__(`category.${category.name}.description`) !== `category.${category.name}.description`
          ? i18n.__(`category.${category.name}.description`)
          : category.description
        : category.description;

      flatList.push({
        id: category.id,
        name: category.name,
        nameCategory: translatedName, // sin indentación de texto
        descriptionCategory: translatedDescription,
        iconCategory: category.icon,
        colorCategory: category.color,
        parent_id: category.parent_id,
        level,           // 👈 nivel de profundidad
        isChild: level > 0,
      });

      // Recursión
      if (category.children?.length > 0) {
        category.children.forEach(child => addToFlatList(child, level + 1));
      }
    };

    // Solo raíces (padres), pero recorremos sus hijos
    const rootCategories = plainCategories.filter(cat => cat.parent_id === null);
    rootCategories.forEach(cat => addToFlatList(cat, 0));

    return flatList;
  } catch (error) {
    logger.error("Error al obtener categorías:", error);
    throw new Error("Error al obtener categorías");
  }
}

  // Método para mapear los hijos de las categorías
  static async mapChildrenCategory(children) {
    return Promise.all(
      children.map(async (child) => {
        const childChildren =
          child.children.length > 0
            ? await CategoryService.mapChildrenCategory(child.children)
            : [];
        const translatedName =
          child.state === 1
            ? i18n.__(`category.${child.name}.name`) !==
              `category.${child.name}.name`
              ? i18n.__(`category.${child.name}.name`)
              : child.name
            : child.name;
        const translatedDescription =
          child.state === 1
            ? i18n.__(`category.${child.name}.description`) !==
              `category.${child.name}.description`
              ? i18n.__(`category.${child.name}.description`)
              : child.description
            : child.description;
        return {
          id: child.id,
          name: translatedName,
          description: translatedDescription,
          color: child.color,
          icon: child.icon,
          parent_id: child.parent_id,
          children: childChildren,
        };
      })
    );
  }
}

module.exports = CategoryService;
