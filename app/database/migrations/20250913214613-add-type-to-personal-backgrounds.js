'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.addColumn('personal_backgrounds', 'typeDetail', {
      type: Sequelize.STRING,
      defaultValue: 'Antecedente',
      allowNull: true,
      comment: 'Tipo de antecedente (por defecto: "Antecedente")',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('personal_backgrounds', 'type');
  }
};
