// models/PetDiet.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PetDiet extends Model {
    static associate(models) {
      // Relación: dieta → mascota
      PetDiet.belongsTo(models.Pet, {
        foreignKey: 'pet_id',
        as: 'pet'
      });

      // Relación: dieta → tipo (frecuencia)
      PetDiet.belongsTo(models.Type, {
        foreignKey: 'type_id',
        as: 'type' // Accederás como diet.frequencyType.name
      });

      // Relación opcional: hogar
      PetDiet.belongsTo(models.Home, {
        foreignKey: 'home_id',
        as: 'home'
      });

      // Relación opcional: persona responsable
      PetDiet.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person'
      });
    }
  }
  PetDiet.init({
    pet_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Pet',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    food_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    portion_size: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Type',
        key: 'id'
      }
    },
    special_instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    home_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Home',
        key: 'id'
      }
    },
    person_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Person',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'PetDiet',
    tableName: 'pet_diets',
    timestamps: true,
  });
  return PetDiet;
};