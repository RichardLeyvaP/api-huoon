'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('home_warehouse_product', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'homes',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      warehouse_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'warehouses',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'statuses',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      unit_price: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: true,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      total_price: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: true,
      },
      purchase_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      purchase_place: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      additional_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      maintenance_date: { // Nuevo campo
        type: Sequelize.DATE,
        allowNull: true,
      },
      due_date: { // Nuevo campo
        type: Sequelize.DATE,
        allowNull: true,
      },
      frequency: { // Nuevo campo
        type: Sequelize.STRING,
        allowNull: true,
      },
      type: { // Nuevo campo
        type: Sequelize.STRING,
        allowNull: true,
      },
      image: {
        allowNull: true,
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('home_warehouse_product');
  }
};