'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('home_person_task', 'role_id', {
      type: Sequelize.BIGINT,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: true // Cambiamos de false a true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('home_person_task', 'role_id', {
      type: Sequelize.BIGINT,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false // Revertimos a false
    });
  }
};