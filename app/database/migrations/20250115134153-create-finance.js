'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('finances', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      person_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'people', // El nombre de la tabla de referencia también debe ser en minúsculas
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'homes',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      spent: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: true,
      },
      income: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: true,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING
      },
      method: {
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
    await queryInterface.dropTable('finances');
  }
};