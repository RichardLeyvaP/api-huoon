'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Recipe extends Model {
    static associate(models) {
      Recipe.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person',
        onDelete: 'CASCADE'
      });
      Recipe.belongsTo(models.Home, {
        foreignKey: 'home_id',
        as: 'home',
        onDelete: 'SET NULL'
      });

      Recipe.hasMany(models.MealRecipe, { foreignKey: 'recipe_id', as: 'recipeMeals',  onDelete: 'CASCADE' });
      Recipe.hasMany(models.RecipeProduct, { foreignKey: 'recipe_id', as: 'recipeProducts',  onDelete: 'CASCADE' });
    }
  }

  Recipe.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    home_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Homes',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_favorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    preparation_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    servings: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    protein: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    carbs: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fats: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fiber: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sugar: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    saturated_fats: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Recipe',
    tableName: 'recipes',
    timestamps: true
  });

  return Recipe;
};