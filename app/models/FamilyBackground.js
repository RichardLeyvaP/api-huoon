'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FamilyBackground extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      FamilyBackground.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person',
      });

      FamilyBackground.belongsTo(models.Home, {
        foreignKey: 'home_id',
        as: 'home',
      });

      FamilyBackground.belongsTo(models.Type, {
        foreignKey: 'type_id',
        as: 'type',
      });
    }
  }
  FamilyBackground.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    person_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Person',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    home_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Home',
        key: 'id'
      },
      allowNull: true,
    },
    type_id: {
      type: DataTypes.INTEGER,   //ENUM('Father', 'Mother', 'Child', 'Sibling', 'Grandparent', 'UncleAunt', 'Other')
      references: {
        model: 'Type', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
        key: 'id'
      },
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    relationship: {
      type: DataTypes.STRING(100), //ENUM('Father', 'Mother', 'Child', 'Sibling', 'Grandparent', 'UncleAunt', 'Other')
      allowNull: true,
    },
    disease: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diagnosis_age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'FamilyBackground',
    tableName: 'family_backgrounds',
    timestamps: true
  });
  return FamilyBackground;
};