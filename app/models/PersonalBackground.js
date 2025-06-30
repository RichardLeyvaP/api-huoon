'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PersonalBackground extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PersonalBackground.belongsTo(models.Person, {
    foreignKey: 'person_id',
    as: 'person', // Nombre de la relación inversa
  });

  // Relación con Type si existe
  PersonalBackground.belongsTo(models.Type, {
    foreignKey: 'type_id',
    as: 'type'
  });
    }
  }
  PersonalBackground.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      type: DataTypes.INTEGER,  //('Enfermedad', 'Alergia', 'Cirugía', 'Hospitalización', 'Medicación', 'Vacunación') 
      references: {
        model: 'Type', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
        key: 'id'
      },
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    details: {
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
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    severity: {
      type: DataTypes.STRING, //('Leve', 'Moderado', 'Severo')
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'PersonalBackground',
    tableName: 'personal_backgrounds',
    timestamps: true
  });
  return PersonalBackground;
};