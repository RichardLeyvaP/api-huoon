'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Finance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Finance.belongsTo(models.Home, { foreignKey: 'home_id', as: 'home', onDelete: 'CASCADE' });
      Finance.belongsTo(models.Person, { foreignKey: 'person_id', as: 'person', onDelete: 'CASCADE' });
    }
  }
  Finance.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
    },
    home_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    person_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    spent: {
      type: DataTypes.DECIMAL(16, 2),
      allowNull: true,
    },
    income: {
      type: DataTypes.DECIMAL(16, 2),
      allowNull: true,
    },
    date: { // Nuevo campo
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Finance',
    tableName: 'finances',
    timestamps: true
  });
  return Finance;
};