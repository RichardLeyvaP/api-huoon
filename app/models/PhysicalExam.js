'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PhysicalExam extends Model {
    static associate(models) {
      PhysicalExam.belongsTo(models.Person, { 
        foreignKey: 'person_id', 
        as: 'person',
        onDelete: 'CASCADE'
      });
      PhysicalExam.belongsTo(models.MedicalConsultation, { 
        foreignKey: 'medical_consultation_id', 
        as: 'medicalConsultation' 
      });
    }
  }
  PhysicalExam.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    medical_consultation_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'MedicalConsultation',
        key: 'id'
      },
      allowNull: true,
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
    blood_pressure: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    pulse: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    exam_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    respiratory_rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    temperature: {
      type: DataTypes.DECIMAL(10, 1),
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    bmi: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    neurological_observations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    respiratory_observations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cardiovascular_observations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    urinary_observations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    digestive_observations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    other_findings: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'PhysicalExam',
    tableName: 'physical_exams',
    timestamps: true,
  });
  return PhysicalExam;
};