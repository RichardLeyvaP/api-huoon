'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('family_backgrounds', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      person_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'people',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'homes',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'types',  // Nombre de la tabla relacionada
          key: 'id',
        },
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      relationship: {
        type: Sequelize.STRING(100), //ENUM('Father', 'Mother', 'Child', 'Sibling', 'Grandparent', 'UncleAunt', 'Other')ENUM('Padre', 'Madre', 'Hijo/a', 'Hermano/a', 'Abuelo/a', 'Tío/a', 'Otro')
        allowNull: true
      },
      disease: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      diagnosis_age: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('family_backgrounds');
  }
};