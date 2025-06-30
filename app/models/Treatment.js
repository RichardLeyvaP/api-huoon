'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Treatment extends Model {
    static associate(models) {
      Treatment.belongsTo(models.Person, { 
        foreignKey: 'person_id', 
        as: 'person',
        onDelete: 'CASCADE'
      });
      
      Treatment.belongsTo(models.MedicalConsultation, { 
        foreignKey: 'medical_consultation_id', 
        as: 'medicalConsultation' 
      });
    }
  }
  Treatment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    person_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'People',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    medical_consultation_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'MedicalConsultation',
        key: 'id'
      },
      allowNull: true,
    },
    medication: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dosage: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    frequency: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Treatment',
    tableName: 'treatments',
    timestamps: true,
  });
  return Treatment;
};