'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MedicalConsultation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      MedicalConsultation.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person'
      });
      MedicalConsultation.belongsTo(models.Type, { foreignKey: 'type_id', as: 'type' });
      MedicalConsultation.hasMany(models.PhysicalExam, {
        foreignKey: 'medical_consultation_id',
        as: 'physicalExams'
        });
        MedicalConsultation.hasMany(models.Diagnosis, {
        foreignKey: 'medical_consultation_id',
        as: 'diagnoses'
        });
    }
  }
  MedicalConsultation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Indica que 'id' es la clave primaria
      autoIncrement: true, // Esto hace que el campo 'id' sea auto-incrementable
    },
    person_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Person', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    type_id: {
      type: DataTypes.INTEGER,  //('Control', 'Urgencia', 'Primera vez', 'Examen', 'Otro')
      references: {
        model: 'Type', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
        key: 'id'
      },
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    professional: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    treatments: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    medicalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    files: {
      type: DataTypes.JSON,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'MedicalConsultation',
    tableName: 'medical_consultations',
    timestamps: true
  });
  return MedicalConsultation;
};