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
    }
  }
  MedicalConsultation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Indica que 'id' es la clave primaria
      autoIncrement: true, // Esto hace que el campo 'id' sea auto-incrementable
    },
    person_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: false,
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