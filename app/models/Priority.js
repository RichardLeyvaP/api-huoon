'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Priority extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Priority.hasMany(models.Task, {
        foreignKey: 'priority_id',
        as: 'tasks',
        onDelete: 'CASCADE'
    });
    }
  }
  Priority.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false, // No puede ser nulo
      validate: {
        notEmpty: {
          msg: 'El nombre no puede estar vacío'
        },
        len: {
          args: [1, 255],
          msg: 'El nombre debe tener entre 1 y 255 caracteres'
        }
      }
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false, // No puede ser nulo
      validate: {
        isInt: {
          msg: 'El nivel debe ser un número entero'
        },
        min: {
          args: [1],
          msg: 'El nivel debe ser mayor o igual a 1'
        }
      }
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true, // No puede ser nulo
      validate: {
        len: {
          args: [1, 50],
          msg: 'El color debe tener entre 1 y 50 caracteres'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true // Puede ser nulo
    }
  }, {
    sequelize,
    modelName: 'Priority',
    tableName: 'priorities',
    timestamps: true, // Para habilitar createdAt y updatedAt
  });
  return Priority;
};