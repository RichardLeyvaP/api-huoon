'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('activity_log', 'home_id', {
      type: Sequelize.BIGINT,
      allowNull: true, // ← permitimos null al principio
      references: {
        model: 'homes', // ← ¡ajusta este nombre si tu tabla se llama diferente!
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // ← si se borra el home, home_id se pone en NULL
    });
  },

  async down(queryInterface, Sequelize) {
    // Luego eliminamos la columna
    await queryInterface.removeColumn('activity_log', 'home_id');
  }
};