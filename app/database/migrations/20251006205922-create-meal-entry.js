'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('meal_entries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: 'PK – Identificador único de la comida registrada'
      },
      daily_log_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'daily_logs',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        comment: 'FK → daily_logs.id – Registro diario al que pertenece'
      },
      type_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'types',
          key: 'id'
        },
        onDelete: 'RESTRICT',
        allowNull: false,
        comment: 'FK → types.id – Tipo de comida (Desayuno, Almuerzo, etc.)'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notas específicas de la comida'
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
    await queryInterface.dropTable('meal_entries');
  }
};