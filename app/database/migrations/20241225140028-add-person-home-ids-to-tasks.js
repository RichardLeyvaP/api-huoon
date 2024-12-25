'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'person_id', {
      type: Sequelize.INTEGER,
      allowNull: true,  // Si quieres permitir nulos
      references: {
        model: 'people',  // La tabla relacionada con la clave foránea
        key: 'id',        // La columna a la que hace referencia
      },
      onUpdate: 'CASCADE', // Opcional, para manejar actualizaciones de claves foráneas
      onDelete: 'SET NULL', // Opcional, para manejar eliminaciones de claves foráneas
    });

    await queryInterface.addColumn('tasks', 'home_id', {
      type: Sequelize.INTEGER,
      allowNull: true,  // Si quieres permitir nulos
      references: {
        model: 'homes',  // La tabla relacionada con la clave foránea
        key: 'id',       // La columna a la que hace referencia
      },
      onUpdate: 'CASCADE', // Opcional, para manejar actualizaciones de claves foráneas
      onDelete: 'SET NULL', // Opcional, para manejar eliminaciones de claves foráneas
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tasks', 'person_id');
    await queryInterface.removeColumn('tasks', 'home_id');
  }
};
