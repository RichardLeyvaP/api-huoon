'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('physical_exams', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      medical_consultation_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "medical_consultations",
          key: "id",
        },
        allowNull: true,
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
      blood_pressure: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      pulse: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      exam_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      respiratory_rate: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      temperature: {
        type: Sequelize.DECIMAL(10, 1),
        allowNull: true
      },
      weight: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      height: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      bmi: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      neurological_observations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cardiovascular_observations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      respiratory_observations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      digestive_observations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      urinary_observations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      other_findings: {
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
    await queryInterface.dropTable('physical_exams');
  }
};