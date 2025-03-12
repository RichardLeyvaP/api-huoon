'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MedicalHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Define la relación con la tabla People
      MedicalHistory.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person',
      });
    }
  }
  MedicalHistory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true, // Indica que 'id' es la clave primaria
        autoIncrement: true, // Esto hace que el campo 'id' sea auto-incrementable
      },
      familyBackground: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      personalBackground: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bloodType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vaccines: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      currentMedications: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      person_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "MedicalHistory",
      tableName: "medical_histories",
      timestamps: true,
    }
  );
  return MedicalHistory;
};