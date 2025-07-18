'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('homes', 'code', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'image' // Posiciona el campo después de 'image'
    });
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.removeColumn('homes', 'code');
  }
};
