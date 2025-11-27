'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // === Tabla `people` ===
    await queryInterface.addColumn('people', 'currency', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Cantidad actual de monedas del usuario'
    });

    await queryInterface.addColumn('people', 'diamonds', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Cantidad actual de diamantes del usuario'
    });

    // === Tabla `tasks` ===
    await queryInterface.addColumn('tasks', 'currency_reward', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Cantidad de monedas que otorga la tarea al completarse'
    });

    await queryInterface.addColumn('tasks', 'diamonds_reward', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Cantidad de diamantes que otorga la tarea al completarse'
    });

    await queryInterface.addColumn('tasks', 'completion_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Fecha en que se completó la tarea (solo fecha)'
    });
  },

  down: async (queryInterface) => {
    // Revertir en orden inverso
    await queryInterface.removeColumn('tasks', 'completion_date');
    await queryInterface.removeColumn('tasks', 'diamonds_reward');
    await queryInterface.removeColumn('tasks', 'currency_reward');
    
    await queryInterface.removeColumn('people', 'diamonds');
    await queryInterface.removeColumn('people', 'currency');
  }
};