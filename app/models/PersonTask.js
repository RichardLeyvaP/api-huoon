'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PersonTask extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
     // Definir asociación con el modelo Person
     PersonTask.belongsTo(models.Person, { foreignKey: 'person_id', as: 'person' });
     PersonTask.belongsTo(models.Task, { foreignKey: 'task_id', as: 'task' });
     PersonTask.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    }
  }
  PersonTask.init({
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
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El campo task_id es obligatorio'
        },
        isInt: {
          msg: 'El campo task_id debe ser un número entero'
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
    }
  },
  {
    sequelize,
    modelName: 'PersonTask',
    tableName: 'person_task',
    timestamps: true,
  }
);
  return PersonTask;
};