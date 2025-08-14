'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('current_medications', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dosage: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'types', // o 'types' si tienes tabla de tipos
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      route: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Vía de administración: oral, inyectable, tópica, etc.'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      prescribed_by: {
        type: Sequelize.STRING,
        allowNull: true,
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
        onUpdate: 'CASCADE',
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

    // Índices para consultas comunes
    await queryInterface.addIndex('current_medications', ['pet_id']);
    await queryInterface.addIndex('current_medications', ['start_date']);
    await queryInterface.addIndex('current_medications', ['end_date']);
    await queryInterface.addIndex('current_medications', ['type_id']);
    await queryInterface.addIndex('current_medications', ['home_id']);
    await queryInterface.addIndex('current_medications', ['person_id']);
    await queryInterface.addIndex('current_medications', ['name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('current_medications');
  }
};