const cron = require('node-cron');
const TaskController = require('../app/controllers/TaskController');
const logger = require('../config/logger');

// Programar un Cron Job que se ejecute cada minuto
cron.schedule('* * * * *', async () => {
    try {
      await TaskController.verificTasksEarrings();
    } catch (error) {
      logger.error('Error en el Cron Job:', error);
    }
  });
  
  // Verificar tareas pendientes al iniciar el servidor
  (async () => {
    try {
      await TaskController.verificTasksEarrings();
    } catch (error) {
      logger.error('Error al verificar tareas pendientes al iniciar:', error);
    }
  })();