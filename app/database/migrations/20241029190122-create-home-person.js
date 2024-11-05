'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('home_person', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'homes', // nombre de la tabla de referencia
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      person_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'people',  // Nombre de la tabla relacionada
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      role_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'roles',  // Nombre de la tabla relacionada
          key: 'id',
        },
        onDelete: 'CASCADE',
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
    await queryInterface.dropTable('home_person');
  }
};