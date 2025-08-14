'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pet_treatments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      next_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dosage: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true  // solo para desparacitación
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: true, // ej: mg, ml, g
        defaultValue: 'ml'
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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

    // Índices para mejorar rendimiento
    await queryInterface.addIndex('pet_treatments', ['pet_id']);
    await queryInterface.addIndex('pet_treatments', ['home_id']);
    await queryInterface.addIndex('pet_treatments', ['person_id']);
    await queryInterface.addIndex('pet_treatments', ['date']);
    await queryInterface.addIndex('pet_treatments', ['next_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pet_treatments');
  }
};