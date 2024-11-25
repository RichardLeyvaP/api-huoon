'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HomeType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      HomeType.hasMany(models.Home, {
        foreignKey: 'home_type_id',   // Clave foránea en la tabla Configuration
        as: 'homes'     // Alias para acceder a las configuraciones del usuario
      });
    }
  }
  HomeType.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false, // El nombre es obligatorio
      validate: {
        notEmpty: {
          msg: 'El nombre no puede estar vacío', // Mensaje de error si está vacío
        },
        len: {
          args: [1, 255],
          msg: 'El nombre debe tener entre 1 y 255 caracteres', // Longitud mínima y máxima
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true, // Descripción es opcional
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true, // Icono es opcional
    },
  }, {
    sequelize,
    modelName: 'HomeType',
    tableName: 'home_types', // Nombre de la tabla en la BD
    timestamps: true, // Para incluir los campos createdAt y updatedAt
  });
  return HomeType;
};