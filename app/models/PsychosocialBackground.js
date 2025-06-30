'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PsychosocialBackground extends Model {
    static associate(models) {
      PsychosocialBackground.belongsTo(models.Person, { 
        foreignKey: 'person_id', 
        as: 'person',
        onDelete: 'CASCADE'
      });
    }
  }
  PsychosocialBackground.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    person_id: {
      type: DataTypes.INTEGER,
      field: 'person_id',
      references: {
        model: 'Person',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    occupation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    educational_level: {
      type: DataTypes.STRING, //ENUM('Basic', 'High School', 'Technical', 'University', 'Postgraduate', 'Other'),
      allowNull: true,
    },
    tobacco_use: {
      type: DataTypes.STRING, //ENUM('No', 'Occasional', 'Frequent', 'Former smoker'),
      allowNull: true,
    },
    alcohol_use: {
      type: DataTypes.STRING, //ENUM('No', 'Occasional', 'Frequent', 'Former consumer'),
      allowNull: true,
    },
    drug_use: {
      type: DataTypes.STRING, //ENUM('No', 'Occasional', 'Frequent', 'Former consumer'),
      allowNull: true,
    },
    physical_activity: {
      type: DataTypes.STRING, //ENUM('Sedentary', 'Light', 'Moderate', 'Intense'),
      allowNull: true,
    },
    family_support: {
      type: DataTypes.STRING, //ENUM('Good', 'Regular', 'Poor', 'None'),
      allowNull: true,
    },
    traumatic_events: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mental_health: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'PsychosocialBackground',
    tableName: 'psychosocial_backgrounds',
    timestamps: true,
  });
  return PsychosocialBackground;
};