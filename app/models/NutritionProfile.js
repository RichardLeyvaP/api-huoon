'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NutritionProfile extends Model {
    static associate(models) {
      NutritionProfile.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person',
        onDelete: 'CASCADE'
      });
    }
  }

  NutritionProfile.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    person_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: {
        model: 'People',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Meta diaria de calorías (ej: 2000)'
    },
    protein: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Meta diaria de proteína en gramos (ej: 80)'
    },
    carbs: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Meta diaria de carbohidratos en gramos'
    },
    fats: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Meta diaria de grasas totales en gramos'
    },
    fiber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Meta diaria de fibra en gramos (ej: 30)'
    },
    sugar_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Límite diario de azúcar en gramos (ej: 25)'
    },
    sat_fats_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Límite diario de grasas saturadas en gramos (ej: 20)'
    },
    water: {
      type: DataTypes.DECIMAL(14, 1),
      allowNull: true,
      comment: 'Meta diaria de agua en litros (ej: 2.0)'
    }
  }, {
    sequelize,
    modelName: 'NutritionProfile',
    tableName: 'nutrition_profiles',
    timestamps: true
  });

  return NutritionProfile;
};