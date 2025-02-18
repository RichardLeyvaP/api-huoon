'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HomePerson extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      HomePerson.belongsTo(models.Home, { foreignKey: 'home_id', as: 'home' });
      HomePerson.belongsTo(models.Person, { foreignKey: 'person_id', as: 'person' });
      HomePerson.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    }
  }
  HomePerson.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
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
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El campo role_id es obligatorio'
        },
        isInt: {
          msg: 'El campo role_id debe ser un número entero'
        }
      }
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
    points: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    interactions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'HomePerson',
    tableName: 'home_person',
    timestamps: true,
  });
  return HomePerson;
};