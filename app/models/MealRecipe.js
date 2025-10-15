'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MealRecipe extends Model {
    static associate(models) {
      MealRecipe.belongsTo(models.MealEntry, {
        foreignKey: 'meal_entry_id',
        as: 'mealEntry',
        onDelete: 'CASCADE'
      });
      MealRecipe.belongsTo(models.Recipe, {
        foreignKey: 'recipe_id',
        as: 'recipe',
        onDelete: 'CASCADE'
      });

    }
  }

  MealRecipe.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    meal_entry_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'MealEntries',
        key: 'id'
      },
      onDelete: 'CASCADE'
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
    servings: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 1.00
    }
  }, {
    sequelize,
    modelName: 'MealRecipe',
    tableName: 'meal_recipes',
    timestamps: true
  });

  return MealRecipe;
};