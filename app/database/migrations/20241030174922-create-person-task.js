'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('person_task', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'people', // Nombre de la tabla referenciada
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false
      },
      task_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'tasks', // Nombre de la tabla referenciada
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false
      },
      role_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'roles', // Nombre de la tabla referenciada
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false
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
    await queryInterface.dropTable('person_task');
  }
};