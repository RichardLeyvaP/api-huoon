'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vet_visits', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      pet_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'pets',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      vet_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      clinic: {
        type: Sequelize.STRING,
        allowNull: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      diagnosis: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      treatment_given: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      recommendations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      next_visit: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'homes',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      person_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'people',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      image: {
        type: Sequelize.STRING,
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

    // Índices para búsquedas comunes
    await queryInterface.addIndex('vet_visits', ['pet_id']);
    await queryInterface.addIndex('vet_visits', ['date']);
    await queryInterface.addIndex('vet_visits', ['next_visit']);
    await queryInterface.addIndex('vet_visits', ['home_id']);
    await queryInterface.addIndex('vet_visits', ['person_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vet_visits');
  }
};