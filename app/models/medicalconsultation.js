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
    }
  }
  MedicalConsultation.init({
    person_id: DataTypes.INTEGER,
    date: DataTypes.DATE,
    reason: DataTypes.TEXT,
    diagnosis: DataTypes.TEXT,
    treatments: DataTypes.JSON,
    medicalNotes: DataTypes.TEXT,
    files: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'MedicalConsultation',
  });
  return MedicalConsultation;
};