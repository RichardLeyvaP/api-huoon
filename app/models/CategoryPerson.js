'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CategoryPerson extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CategoryPerson.belongsTo(models.Category, {
        foreignKey: 'category_id', // Clave foránea en CategoryPerson
        as: 'category', // Alias para acceder a la categoría
        onDelete: 'CASCADE', // Opcional: elimina la categoría si se elimina la categoría principal
      });

      // Relación belongsTo con Person
      CategoryPerson.belongsTo(models.Person, {
        foreignKey: 'person_id', // Clave foránea en CategoryPerson
        as: 'person', // Alias para acceder a la persona
        onDelete: 'CASCADE', // Opcional: elimina el registro si se elimina la persona
      });
    }
  }
  CategoryPerson.init({
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    category_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    person_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'people',
            key: 'id',
        },
        onDelete: 'CASCADE',
    }
  }, {
    sequelize,
    modelName: 'CategoryPerson',
    tableName: 'category_person', // Nombre de la tabla en la BD
    timestamps: true, // Para incluir los campos createdAt y updatedAt
  });
  return CategoryPerson;
};