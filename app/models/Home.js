'use strict';
const {
  Model
} = require('sequelize');
const Person = require('./Person');
module.exports = (sequelize, DataTypes) => {
  class Home extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Home.belongsTo(models.HomeType, {
        foreignKey: 'home_type_id',
        as: 'homeType'
      });

      Home.belongsToMany(models.Person, {
        through: 'home_person',
        foreignKey: 'home_id',
        otherKey: 'person_id',
        as: 'people',  // Alias para la relación
      });

      Home.belongsToMany(models.Warehouse, {
        through: models.HomeWarehouse,
        foreignKey: 'home_id',    // La clave foránea en la tabla pivote HomeWarehouse
        otherKey: 'warehouse_id', // La otra clave foránea en la tabla pivote HomeWarehouse
        as: 'warehouses'          // Alias para acceder a los almacenes asociados al hogar
    });

    Home.hasMany(models.PersonWarehouse, {
      foreignKey: 'home_id',  // Asegúrate de que el campo sea consistente
      as: 'personWarehouses', // Nombre del alias
      onDelete: 'CASCADE'     // Elimina las asociaciones en cascada si se elimina el hogar
  });
    }
  }
  Home.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    home_type_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'HomeType', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    residents: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    geo_location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Activa',
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Home',
    tableName: 'homes',
    timestamps: true, // Esto habilita createdAt y updatedAt
  });
  return Home;
};