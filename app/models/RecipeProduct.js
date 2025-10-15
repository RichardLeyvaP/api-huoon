'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecipeProduct extends Model {
    static associate(models) {
      RecipeProduct.belongsTo(models.Recipe, {
        foreignKey: 'recipe_id',
        as: 'recipe',
        onDelete: 'CASCADE'
      });
      RecipeProduct.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'CASCADE'
      });
    }
  }

  RecipeProduct.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    recipe_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Recipes',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    product_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    person_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'People',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    quantity: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    calories_per_unit: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    protein_per_unit: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    carbs_per_unit: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    fats_per_unit: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    fiber_per_unit: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    sugar_per_unit: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    saturated_fats_per_unit: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'RecipeProduct',
    tableName: 'recipe_products',
    timestamps: true
  });

  return RecipeProduct;
};