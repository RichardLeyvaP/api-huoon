'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HomeWarehouseProduct extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      HomeWarehouseProduct.belongsTo(models.Home, { foreignKey: 'home_id', as: 'home', onDelete: 'CASCADE' });
      HomeWarehouseProduct.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse', onDelete: 'CASCADE' });
      HomeWarehouseProduct.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product', onDelete: 'CASCADE' });
      HomeWarehouseProduct.belongsTo(models.Status, { foreignKey: 'status_id', as: 'status', onDelete: 'CASCADE' });
    }
  }
  HomeWarehouseProduct.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
    },
    home_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    warehouse_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    status_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(16, 2),
      allowNull: true,
    },
    cant: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_price: {
      type: DataTypes.DECIMAL(16, 2),
      allowNull: true,
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    purchase_place: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiration_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    additional_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    maintenance_date: { // Nuevo campo
      type: DataTypes.DATE,
      allowNull: true,
    },
    due_date: { // Nuevo campo
      type: DataTypes.DATE,
      allowNull: true,
    },
    frequency: { // Nuevo campo
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: { // Nuevo campo
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'HomeWarehouseProduct',
    tableName: 'home_warehouse_product',
    timestamps: true,
  });
  return HomeWarehouseProduct;
};