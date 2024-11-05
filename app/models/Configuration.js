'use strict';
const {
  Model
} = require('sequelize');
//const User = require('./User');
module.exports = (sequelize, DataTypes) => {
  class Configuration extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Configuration.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  Configuration.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'User', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: true, // Puede ser nulo para configuraciones del sistema
    },
    appName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    appVersion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    defaultCurrency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    themeColor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    backgroundColor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    textColor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    buttonColor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDarkModeEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    notificationsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    apiEndpoint: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    connectionTimeout: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    retryAttempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    useBiometricAuth: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    requirePinForSensitiveActions: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    storagePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maxCacheSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    autoUpdateEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    supportContactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastSyncTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fontSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Configuration',
    tableName: 'configurations', // Asegúrate de que el nombre de la tabla sea correcto
    timestamps: true, // Si deseas incluir createdAt y updatedAt
  });
  return Configuration;
};