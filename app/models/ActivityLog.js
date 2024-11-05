'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ActivityLog extends Model {
       /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define associations here
    }
  }
  ActivityLog.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false, // Asegúrate de definir si el campo es obligatorio
    },
    modelName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Puede ser nulo si no siempre se registra un usuario
    },
    newData: {
      type: DataTypes.TEXT,
      allowNull: true, // Puede ser nulo si no siempre se registra información nueva
    },
  }, {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'activity_log',
    timestamps: true, // Esto agregará automáticamente createdAt y updatedAt
  });

  return ActivityLog;
};