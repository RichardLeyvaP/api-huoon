"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Relación con la tabla de personas
      File.belongsTo(models.Person, {
        foreignKey: "personId",
        as: "person",
      });

      // Relación con la tabla de hogares
      File.belongsTo(models.Home, {
        foreignKey: "homeId",
        as: "home",
      });
    }
  }
  File.init(
    {
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      archive: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      personal: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
    },
    {
      sequelize,
      modelName: "File",
      tableName: "files", // Nombre de la tabla en la base de datos
      timestamps: true, // Habilita createdAt y updatedAt
    }
  );
  return File;
};
