'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('home_warehouse', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'homes', // Cambia esto al nombre de tu tabla de hogares
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      warehouse_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'warehouses', // Cambia esto al nombre de tu tabla de almacenes
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1, // Campo para saber si es público o privado
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('home_warehouse');
  }
};