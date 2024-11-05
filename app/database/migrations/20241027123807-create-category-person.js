'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('category_person', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      category_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'categories', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
          key: 'id'
        },
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'people', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
          key: 'id'
        },
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
    await queryInterface.dropTable('category_person');
  }
};