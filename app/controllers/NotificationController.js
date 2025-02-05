const logger = require("../../config/logger");
const { NotificationRepository } = require("../repositories");

const NotificationController = {
  async sendNotification(req, res) {
    try {
      //logger.info(`${req.user.name} - Entra a enviar notificación`);

      const firebaseResult = await NotificationRepository.sendNotification(
        req.body
      );

      return res.status(firebaseResult.success ? 200 : 500).json({
        message: firebaseResult.success
          ? "Notificación enviada y guardada"
          : "Error al enviar la notificación",
        firebaseResponse: firebaseResult.success
          ? firebaseResult.response
          : null,
        error: firebaseResult.success ? null : firebaseResult.error,
      });
    } catch (error) {
        const errorMsg = error.details
        ? error.details.map(detail => detail.message).join(', ')
        : error.message || 'Error desconocido';
        logger.error('Error en NotificationController->sendNotification: ' + errorMsg);

      return res.status(500).json({
        message: "Error interno en el servidor",
        error: errorMsg,
      });
    }
  },
};

module.exports = NotificationController;
