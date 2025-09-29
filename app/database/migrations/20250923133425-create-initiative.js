'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('initiatives', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Nombre o título de la iniciativa'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Descripción detallada de la iniciativa'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Tipo de iniciativa: goal, task, habit, milestone, etc.'
      },
      priority_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'priorities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Relación con tabla priorities'
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'initiatives',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Permite anidar iniciativas (hijas de otras)'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Estado actual: Activa, Inactiva'
      },
      recurrence: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Frecuencia: daily, weekly, monthly, custom'
      },
      person_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'people',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Persona responsable o asignada'
      },
      task_type: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Subtipo de tarea: admin, creative, physical, etc.'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: 'Fecha de creación'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: 'Fecha de última actualización'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Initiatives');
  }
};