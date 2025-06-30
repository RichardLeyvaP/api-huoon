'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Diagnosis extends Model {
    static associate(models) {
      Diagnosis.belongsTo(models.Person, { 
        foreignKey: 'person_id', 
        as: 'person',
        onDelete: 'CASCADE'
      });
      
      Diagnosis.belongsTo(models.MedicalConsultation, { 
        foreignKey: 'medical_consultation_id', 
        as: 'medicalConsultation' 
      });
      
      Diagnosis.belongsTo(models.Type, { 
        foreignKey: 'type_id', 
        as: 'type' 
      });
    }
  }
  Diagnosis.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    person_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Person',
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
    type_id: {
      type: DataTypes.INTEGER, //ENUM('Presuntivo', 'Definitivo', 'Diferencial')
      references: {
        model: 'Type',
        key: 'id'
      },
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cie10_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Diagnosis',
    tableName: 'diagnoses',
    timestamps: true,
  });
  return Diagnosis;
};