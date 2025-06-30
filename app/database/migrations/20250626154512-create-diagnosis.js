'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('diagnoses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: "people",
          key: "id",
        },
        onDelete: 'CASCADE',
        allowNull: false,
      },
      medical_consultation_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "medical_consultations",
          key: "id",
        },
        allowNull: true,
      },
      type_id: {
        type: Sequelize.INTEGER, //ENUM('Presuntivo', 'Definitivo', 'Diferencial')
        references: {
          model: "types",
          key: "id",
        },
        allowNull: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      cie10_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('diagnoses');
  }
};