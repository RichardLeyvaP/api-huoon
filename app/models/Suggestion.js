'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Suggestion extends Model {
    static associate(models) {
      Suggestion.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person',
        onDelete: 'CASCADE',
      });

      Suggestion.belongsTo(models.Home, {
        foreignKey: 'home_id',
        as: 'home',
        onDelete: 'SET NULL',
      });
    }
  }

  Suggestion.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    person_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    home_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Suggestion',
    tableName: 'suggestions',
    timestamps: true
  });

  return Suggestion;
};
