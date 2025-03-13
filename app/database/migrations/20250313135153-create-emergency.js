'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('emergencies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'people', // Asegúrate de que este sea el nombre correcto de la tabla de personas
          key: 'id'
        }
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      type_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'types', // Asegúrate de que este sea el nombre correcto de la tabla de personas
          key: 'id'
        }
      },
      symptoms: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      actionTaken: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      contactAlerted: {
        type: Sequelize.JSON,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('emergencies');
  }
};