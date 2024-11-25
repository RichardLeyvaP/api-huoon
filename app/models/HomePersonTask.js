'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HomePersonTask extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
     // Definir asociación con el modelo Person
     HomePersonTask.belongsTo(models.Person, { foreignKey: 'person_id', as: 'person' });
     HomePersonTask.belongsTo(models.Task, { foreignKey: 'task_id', as: 'task' });
     HomePersonTask.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
     HomePersonTask.belongsTo(models.Home, { foreignKey: 'home_id', as: 'home' });
    }
  }
  HomePersonTask.init({
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
    }
  },
  {
    sequelize,
    modelName: 'HomePersonTask',
    tableName: 'home_person_task',
    timestamps: true,
  }
);
  return HomePersonTask;
};