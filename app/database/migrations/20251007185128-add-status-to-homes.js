'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.addColumn('homes', 'status_approval', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('homes', 'reset_code', {
      type: Sequelize.INTEGER, // o Sequelize.BIGINT si esperas números grandes
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('homes', 'reset_code');
    await queryInterface.removeColumn('homes', 'status_approval');
  }
};
