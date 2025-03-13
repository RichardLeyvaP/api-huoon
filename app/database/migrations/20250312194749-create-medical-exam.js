'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medicalexams', {
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
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      type_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "types",
          key: "id",
        },
      },
      result: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      archive: {
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
    await queryInterface.dropTable('medicalexams');
  }
};