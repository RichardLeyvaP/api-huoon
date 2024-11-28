'use strict';
const { Model } = require('sequelize');
const { Op } = require('sequelize');
const i18n = require('../../config/i18n-config');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      // Una categoría puede tener muchas subcategorías (relación de uno a muchos)
      Category.hasMany(models.Category, {
        foreignKey: 'parent_id',
        as: 'children',
        onDelete: 'CASCADE'
      });

      // Una subcategoría pertenece a una categoría (relación de uno a muchos)
      Category.belongsTo(models.Category, {
        foreignKey: 'parent_id',
        as: 'parent'
      });

       // Relación belongsToMany con Person a través de CategoryPerson
       Category.belongsToMany(models.Person, {
        through: models.CategoryPerson, // Tabla intermedia
        foreignKey: 'category_id', // Clave foránea en CategoryPerson
        otherKey: 'person_id', // Clave foránea en CategoryPerson
        as: 'people', // Alias para acceder a las personas asociadas a la categoría
      });

      Category.hasMany(models.Task, {
        foreignKey: 'category_id',
        as: 'tasks',
        onDelete: 'CASCADE'
    });

    Category.hasMany(models.Product, {
      foreignKey: 'category_id',
      as: 'products',
      onDelete: 'CASCADE'
  });
    }

    static async getCategories(personId, type) {
      try {
        const categories = await this.findAll({
          where: {
            type: type,
            [Op.or]: [
              { state: 1 },
              { '$people.id$': personId }, // Filtra por relación en tabla intermedia
            ],
          },
          include: [
            {
              association: 'people',
              required: false, // Permite categorías sin relación con personas
            },
            { association: 'children' },
          ],
        });

        // Transformar las categorías y procesar recursivamente las hijas
        const transformedCategories = await Promise.all(
          categories.map(async (category) => {
            const children = category.children.length > 0
              ? await this.mapChildrenCategory(category.children)
              : [];

            const translatedName =
              category.state === 1
                ? i18n.__(`category.${category.name}.name`)
                : category.name;
            const translatedDescription =
              category.state === 1
                ? i18n.__(`category.${category.name}.description`)
                : category.description;

            return {
              id: category.id,
              nameCategory: translatedName,
              descriptionCategory: translatedDescription,
              colorCategory: category.color,
              iconCategory: category.icon,
              parent_id: category.parent_id,
              children: children,
            };
          })
        );

        return transformedCategories;
      } catch (error) {
        console.error('Error en getCategories:', error);
        throw new Error('Error al obtener categorías');
      }
    }

    /**
     * Mapear recursivamente categorías hijas.
     */
    static async mapChildrenCategory(children) {
      return Promise.all(
        children.map(async (child) => {
          const childChildren = child.children.length > 0
            ? await this.mapChildrenCategory(child.children)
            : [];

          const translatedName =
            child.state === 1
              ? i18n.__(`category.${child.name}.name`)
              : child.name;
          const translatedDescription =
            child.state === 1
              ? i18n.__(`category.${child.name}.description`)
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

  Category.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    parent_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Category', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
        key: 'id'
      },
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
  });

  return Category;
};
