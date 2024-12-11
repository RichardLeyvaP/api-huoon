'use strict';
const {
  Model
} = require('sequelize');
const logger = require('../../config/logger');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relación uno a muchos con home_person
      Role.hasMany(models.HomePerson, {
        foreignKey: 'role_id',
        as: 'homePerson',  // Alias para la relación con home_person
      });

      Role.hasMany(models.HomePersonTask, {
        foreignKey: 'role_id',
        as: 'homePersonTasks',  // Alias para la relación con home_person
      });
    }
  }
  Role.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Validación de unicidad
      validate: {
        notEmpty: { msg: 'El nombre no puede estar vacío' },
        len: { args: [3, 255], msg: 'El nombre debe tener entre 3 y 255 caracteres' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: { args: [0, 500], msg: 'La descripción no puede exceder los 500 caracteres' }
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Sistema',
    },
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles', // Nombre de la tabla
    timestamps: true
});

  return Role;
};