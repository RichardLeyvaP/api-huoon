'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      action: {
        type: Sequelize.STRING
      },
      modelName: {
        type: Sequelize.STRING
      },
      modelId: {
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: true, // ← permitimos null al principio
        references: {
          model: 'homes', // ← ¡ajusta este nombre si tu tabla se llama diferente!
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // ← si se borra el home, home_id se pone en NULL
      },
      newData: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activity_log');
  }
};