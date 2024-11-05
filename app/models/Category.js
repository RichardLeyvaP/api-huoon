'use strict';
const { Model } = require('sequelize');

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
    }
  }

  Category.init({
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
