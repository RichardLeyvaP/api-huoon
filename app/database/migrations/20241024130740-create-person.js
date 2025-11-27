'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('people', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      user_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING
      },
      birth_date: {
        allowNull: true,
        type: Sequelize.DATE
      },
      age: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      gender: {
        allowNull: true,
        type: Sequelize.STRING
      },
      email: {
        allowNull: true,
        type: Sequelize.STRING
      },
      phone: {
        allowNull: true,
        type: Sequelize.STRING
      },
      address: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      image: {
        allowNull: true,
        type: Sequelize.STRING
      },      
      emergencyContact: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currency: {
       type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Cantidad actual de monedas del usuario'
      },
      diamonds: {
       type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Cantidad actual de diamantes del usuario'
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
    await queryInterface.dropTable('people');
  }
};