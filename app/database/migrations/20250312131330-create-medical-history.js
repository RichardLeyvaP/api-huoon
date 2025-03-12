'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("medical_histories", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      familyBackground: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      personalBackground: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bloodType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      vaccines: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      currentMedications: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: "people",
          key: "id",
        },
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
    await queryInterface.dropTable('medical_histories');
  }
};