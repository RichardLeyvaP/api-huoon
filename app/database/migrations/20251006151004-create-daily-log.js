'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('daily_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'people',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Fecha del registro (ej: 2024-08-26)'
      },
      water_intake: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        comment: 'Agua consumida en litros (ej: 1.5)'
      },
      sleep_hours: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Horas de sueño'
      },
      steps: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Pasos caminados en el día'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notas libres del usuario'
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

    // Clave única: una persona solo puede tener un registro por fecha
    await queryInterface.addConstraint('daily_logs', {
      fields: ['person_id', 'date'],
      type: 'unique',
      name: 'daily_logs_person_id_date_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('daily_logs', 'daily_logs_person_id_date_unique');
    await queryInterface.dropTable('daily_logs');
  }
};