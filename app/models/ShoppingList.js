'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ShoppingListItem extends Model {
    static associate(models) {
      ShoppingListItem.belongsTo(models.Person, { foreignKey: 'person_id', as: 'person' });
      ShoppingListItem.belongsTo(models.Home, { foreignKey: 'home_id', as: 'home' });
      // Nota: product_id no tiene relación foránea activa (es denormalizado para flexibilidad)
    }
  }

  ShoppingListItem.init({
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    person_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID de la persona'
    },
    home_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID del hogar'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Fecha de compra'
    },
    person_home_warehouse_product_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID en person_home_warehouse_product_id'
    },
    product_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID del producto'
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nombre del producto'
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL de imagen'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Cantidad'
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Motivo'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Pendiente',
      comment: 'Estado: pending, bought, cancelled'
    }
  }, {
    sequelize,
    modelName: 'ShoppingList',
    tableName: 'shopping_list',
    timestamps: true
  });

  return ShoppingListItem;
};