'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MealEntry extends Model {
    static associate(models) {
      MealEntry.belongsTo(models.DailyLog, {
        foreignKey: 'daily_log_id',
        as: 'dailyLog',
        onDelete: 'CASCADE'
      });
      MealEntry.belongsTo(models.Type, {
        foreignKey: 'type_id',
        as: 'type',
        onDelete: 'RESTRICT'
      });
      MealEntry.hasMany(models.MealRecipe, { foreignKey: 'meal_entry_id', as: 'mealRecipes',  onDelete: 'CASCADE' });
    }
  }

  MealEntry.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    daily_log_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DailyLogs',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Types',
        key: 'id'
      },
      onDelete: 'RESTRICT'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'MealEntry',
    tableName: 'meal_entries',
    timestamps: true
  });

  return MealEntry;
};