'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.addColumn('tasks', 'task_type', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'Personal',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tasks', 'task_type');
  }
};
