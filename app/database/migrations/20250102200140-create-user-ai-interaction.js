'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_interactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      module: {
        type: Sequelize.STRING
      },
      question: {
        type: Sequelize.TEXT('long'),
      },
      answer: {
        type: Sequelize.TEXT('long'),
      },
      user_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false
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
    await queryInterface.dropTable('ai_interactions');
  }
};