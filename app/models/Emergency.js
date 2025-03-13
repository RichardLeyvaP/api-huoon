'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Emergency extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Emergency.belongsTo(models.Person, { foreignKey: 'person_id', as: 'person' });
      Emergency.belongsTo(models.Type, { foreignKey: 'type_id', as: 'type' });
    }
  }
  Emergency.init({
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
      type: DataTypes.DATE,
      allowNull: false,
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    symptoms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    actionTaken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactAlerted: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Emergency',
    tableName: 'emergencies',
    timestamps: true
  });
  return Emergency;
};