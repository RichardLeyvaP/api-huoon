'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MedicalExam extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      MedicalExam.belongsTo(models.Person, { foreignKey: 'person_id' });
      MedicalExam.belongsTo(models.Type, { foreignKey: 'type_id' });
    }
  }
  MedicalExam.init({
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
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    archive: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'MedicalExam',
    tableName: 'medicalexams',
    timestamps: true
  });
  return MedicalExam;
};