'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HouseholdRequest extends Model {
    static associate(models) {
      HouseholdRequest.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      HouseholdRequest.belongsTo(models.User, {
        foreignKey: 'targetUserId',
        as: 'targetUser'
      });
    }
  }

  HouseholdRequest.init({
     id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    targetUserId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    targetUserEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    module: {
      type: DataTypes.STRING,
      allowNull: true
    },
    moduleId: {
      type: DataTypes.INTEGER, // o DataTypes.STRING si usas UUIDs
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'HouseholdRequest',
    tableName: 'house_hold_requests',
    timestamps: true
  });

  return HouseholdRequest;
};