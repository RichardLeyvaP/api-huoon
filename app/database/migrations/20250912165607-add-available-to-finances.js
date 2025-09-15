'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('finances', 'available', {
      type: Sequelize.DECIMAL(16, 2),
      allowNull: true,
      comment: 'Saldo disponible después de ingresos y gastos'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('finances', 'available');
  }
};
