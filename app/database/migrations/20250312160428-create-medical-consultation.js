'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medical_consultations', {
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
      },
      date: {
        type: Sequelize.DATEONLY
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      diagnosis: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      treatments: {
        type: Sequelize.JSON
      },
      medicalNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      files: {
        type: Sequelize.JSON,
        allowNull: true,
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
    await queryInterface.dropTable('medical_consultations');
  }
};