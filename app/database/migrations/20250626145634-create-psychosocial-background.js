'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('psychosocial_backgrounds', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      occupation: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      educational_level: {
        type: Sequelize.STRING, //ENUM('Basic', 'High School', 'Technical', 'University', 'Postgraduate', 'Other'),
        allowNull: true
      },
      tobacco_use: {
        type: Sequelize.STRING, //ENUM('No', 'Occasional', 'Frequent', 'Former smoker'),
        allowNull: true
      },
      alcohol_use: {
        type: Sequelize.STRING, //ENUM('No', 'Occasional', 'Frequent', 'Former consumer'),
        allowNull: true
      },
      drug_use: {
        type: Sequelize.STRING, //ENUM('No', 'Occasional', 'Frequent', 'Former consumer'),
        allowNull: true
      },
      physical_activity: {
        type: Sequelize.STRING, //ENUM('Sedentary', 'Light', 'Moderate', 'Intense'),
        allowNull: true
      },
      family_support: {
        type: Sequelize.STRING, //ENUM('Good', 'Regular', 'Poor', 'None'),
        allowNull: true
      },
      traumatic_events: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      mental_health: {
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
    await queryInterface.dropTable('psychosocial_backgrounds');
  }
};