'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.addColumn('users', 'reset_token', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Hashed recovery code'
    });

    await queryInterface.addColumn('users', 'onboarding_status', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Current onboarding completion status'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'reset_token');
    await queryInterface.removeColumn('users', 'onboarding_status');
  }
};
