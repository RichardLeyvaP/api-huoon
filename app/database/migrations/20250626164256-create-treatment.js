'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('treatments', {
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
        type: Sequelize.INTEGER,
        references: {
          model: "types",
          key: "id",
        },
        allowNull: true,
      },
      medication: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      dosage: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      frequency: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      duration: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      purpose: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      endDate: {
        type: Sequelize.DATEONLY,
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
    await queryInterface.dropTable('treatments');
  }
};