'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DailyLog extends Model {
    static associate(models) {
      DailyLog.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person',
        onDelete: 'CASCADE'
      });
      DailyLog.hasMany(models.MealEntry, { foreignKey: 'daily_log_id', as: 'mealEntries',  onDelete: 'CASCADE' });
    }
  }

  DailyLog.init({
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    water_intake: {
      type: DataTypes.DECIMAL(14, 1),
      allowNull: true
    },
    sleep_hours: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    steps: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'DailyLog',
    tableName: 'daily_logs',
    timestamps: true
  });

  return DailyLog;
};