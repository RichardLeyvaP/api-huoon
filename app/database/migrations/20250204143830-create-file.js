'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      archive: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      size: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'people', // Nombre de la tabla de personas
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      home_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'homes', // Nombre de la tabla de hogares
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      personal: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
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
    await queryInterface.dropTable('files');
  }
};