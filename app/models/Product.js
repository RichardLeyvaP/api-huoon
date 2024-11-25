'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category', onDelete: 'CASCADE' });
      Product.hasMany(models.HomeWarehouseProduct, { foreignKey: 'product_id', as: 'warehouseStocks', onDelete: 'CASCADE' });
      Product.hasMany(models.PersonHomeWarehouseProduct, { foreignKey: 'product_id', as: 'homeWarehouseProducts', onDelete: 'CASCADE' });
    }
  }
  Product.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El campo category_id es obligatorio'
        },
        isInt: {
          msg: 'El campo category_id debe ser un número entero'
        }
      }
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
  });
  return Product;
};