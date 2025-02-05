'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('configurations', {
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
        allowNull: true
      },
      appName: {
        type: Sequelize.STRING
      },
      appVersion: {
        type: Sequelize.STRING
      },
      language: {
        type: Sequelize.STRING
      },
      defaultCurrency: {
        type: Sequelize.STRING
      },
      themeColor: {
        type: Sequelize.STRING
      },
      backgroundColor: {
        type: Sequelize.STRING
      },
      textColor: {
        type: Sequelize.STRING
      },
      buttonColor: {
        type: Sequelize.STRING
      },
      isDarkModeEnabled: {
        type: Sequelize.BOOLEAN
      },
      notificationsEnabled: {
        type: Sequelize.BOOLEAN
      },
      apiEndpoint: {
        type: Sequelize.STRING
      },
      connectionTimeout: {
        type: Sequelize.INTEGER
      },
      retryAttempts: {
        type: Sequelize.INTEGER
      },
      useBiometricAuth: {
        type: Sequelize.BOOLEAN
      },
      requirePinForSensitiveActions: {
        type: Sequelize.BOOLEAN
      },
      storagePath: {
        type: Sequelize.STRING
      },
      maxCacheSize: {
        type: Sequelize.INTEGER
      },
      autoUpdateEnabled: {
        type: Sequelize.BOOLEAN
      },
      supportContactEmail: {
        type: Sequelize.STRING
      },
      lastSyncTime: {
        type: Sequelize.DATE
      },
      fontSize: {
        type: Sequelize.INTEGER
      },
      isDefault: {
        type: Sequelize.BOOLEAN
      },
      home: {
        type: Sequelize.INTEGER
      },
      tokenNotification: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('configurations');
  }
};