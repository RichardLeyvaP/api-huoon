'use strict';

const { Configuration } = require('../../models/index'); // Importa el modelo de Configuration

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Configuration.upsert({
      appName: 'Huoon',
      appVersion: '1.0.0',
      language: 'es',
      defaultCurrency: 'USD',
      themeColor: '#FFFFFF',
      backgroundColor: '#F0F0F0',
      textColor: '#000000',
      buttonColor: '#007BFF',
      isDarkModeEnabled: true,
      notificationsEnabled: true,
      apiEndpoint: 'https://api.miapp.com',
      connectionTimeout: 30,
      retryAttempts: 3,
      useBiometricAuth: true,
      requirePinForSensitiveActions: true,
      storagePath: '/data/app',
      maxCacheSize: 1024,
      autoUpdateEnabled: true,
      supportContactEmail: 'soporte@miapp.com',
      lastSyncTime: new Date(), // Fecha actual
      fontSize: 14,
      isDefault: true,  // Mantén la configuración como la predeterminada
    }, {
      where: { isDefault: true } // Condición para encontrar la configuración por defecto
    });
  },

  async down (queryInterface, Sequelize){
    // Aquí puedes definir la lógica para revertir los cambios si es necesario.
    await queryInterface.bulkDelete('configurations', {
      isDefault: true
    });
  }
};
