'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('finances', 'budget_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Hacemos la relación nullable
      references: {
        model: 'budgets', // Nombre de la tabla referenciada
        key: 'id'           // Columna referenciada
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'  // Si se borra la categoría, se setea NULL en finances
    });
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.removeColumn('finances', 'budget_id');
  }
};
