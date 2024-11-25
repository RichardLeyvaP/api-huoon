'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Warehouse.belongsToMany(models.Home, {
        through: models.HomeWarehouse,
        foreignKey: 'warehouse_id',    // La clave foránea en la tabla pivote HomeWarehouse
        otherKey: 'home_id',           // La otra clave foránea en la tabla pivote HomeWarehouse
        as: 'homes'                    // Alias para acceder a los hogares asociados al almacén
    });

      Warehouse.belongsToMany(models.Person, {
        through: models.PersonWarehouse,
        foreignKey: 'warehouse_id',    // La clave foránea en la tabla pivote HomeWarehouse
        otherKey: 'person_id',           // La otra clave foránea en la tabla pivote HomeWarehouse
        as: 'people'                    // Alias para acceder a los hogares asociados al almacén
    });

    Warehouse.hasMany(models.HomeWarehouseProduct, { foreignKey: 'warehouse_id', as: 'warehouseProducts', onDelete: 'CASCADE' });
    Warehouse.hasMany(models.PersonHomeWarehouseProduct, { foreignKey: 'warehouse_id', as: 'warehousePersonProducts', onDelete: 'CASCADE' });
    }
  }
  Warehouse.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
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
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'Warehouse',
    tableName: 'warehouses',
    timestamps: true,
  });
  return Warehouse;
};