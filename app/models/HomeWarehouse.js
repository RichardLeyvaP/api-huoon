'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HomeWarehouse extends Model {
    static associate(models) {
      // Define associations here
      HomeWarehouse.belongsTo(models.Home, { foreignKey: 'home_id', as:"home" });
      HomeWarehouse.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id', as:"warehouse" });
    }
  }
  
  HomeWarehouse.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
    },
    home_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El campo home_id es obligatorio'
        },
        isInt: {
          msg: 'El campo home_id debe ser un número entero'
        }
      }
    },
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El campo warehouse_id es obligatorio'
        },
        isInt: {
          msg: 'El campo warehouse_id debe ser un número entero'
        }
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1, // Campo para saber si es público o privado
    },
  }, {
    sequelize,
    modelName: 'HomeWarehouse',
    tableName: 'home_warehouse',
    timestamps: true,
  });
  return HomeWarehouse;
};