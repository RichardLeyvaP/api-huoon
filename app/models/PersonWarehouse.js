'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PersonWarehouse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PersonWarehouse.belongsTo(models.Home, { foreignKey: 'home_id', as:'home', onDelete: 'CASCADE' });
      PersonWarehouse.belongsTo(models.Person, { foreignKey: 'person_id', as:'person', onDelete: 'CASCADE' });
      PersonWarehouse.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id', as:'warehouse', onDelete: 'CASCADE' });
    }
  }
  PersonWarehouse.init({
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
    person_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El campo person_id es obligatorio'
        },
        isInt: {
          msg: 'El campo person_id debe ser un número entero'
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
    modelName: 'PersonWarehouse',
    tableName: 'person_warehouse',
    timestamps: true,
  });
  return PersonWarehouse;
};