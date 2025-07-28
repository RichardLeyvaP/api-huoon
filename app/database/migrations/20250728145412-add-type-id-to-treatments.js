'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.addColumn('treatments', 'type_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'types',  // Asegúrate que este es el nombre correcto de tu tabla de tipos
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

  },

  async down (queryInterface, Sequelize) {
    // Paso 2: Eliminar la columna type_id
    await queryInterface.removeColumn('treatments', 'type_id');
  }
};
