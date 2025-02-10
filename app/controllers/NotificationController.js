const logger = require("../../config/logger");
const {
  NotificationRepository,
  UserRepository,
  HomeRepository,
} = require("../repositories");

const NotificationController = {
  async sendNotification(req, res) {
    try {
      const home = await HomeRepository.findById(req.body.home_id);
      if (!home) {
        logger.error(
          `FileController->store: Hogar no encontrado con ID ${home_id}`
        );
        return res.status(404).json({ msg: "HomeNotFound" });
      }
      //logger.info(`${req.user.name} - Entra a enviar notificación`);
      const { tokens, userTokens } =
        await UserRepository.getUserNotificationTokens();

      //return res.status(200).json({ tokens: tokens, userTokens: userTokens });
      if (!tokens.length) {
        return res
          .status(404)
          .json({ message: "No se encontraron tokens de notificación" });
      }

      // Construir el body para la notificación
      const notificationPayload = {
        token: tokens,
        notification: {
          title: req.body.title || "Sin título",
          body: req.body.body || "Sin contenido",
        },
        data: {
          route: req.body.route || "/",
          home_id: home.id,
          nameHome: home.name,
        },
      };
      const firebaseResult = await NotificationRepository.sendNotification(
        notificationPayload
      );

      // Verificar cuáles tokens recibieron una respuesta exitosa
      if (firebaseResult && firebaseResult.success) {
        const successfulTokens = tokens; // Firebase no devuelve tokens fallidos en un 200

        // Registrar cada notificación enviada correctamente en la base de datos
        const notificationsToCreate = userTokens
          .filter((user) => successfulTokens.includes(user.firebaseId)) // Solo los tokens que se enviaron bien
          .map((user) => ({
            home_id: req.body.home_id,
            user_id: user.user_id,
            title: req.body.title,
            description: req.body.body,
            data: JSON.stringify(notificationPayload.data),
            route: req.body.route,
            firebaseId: user.firebaseId,
          }));

        // Insertar las notificaciones en la base de datos
        await Promise.all(
          notificationsToCreate.map((notification) =>
            NotificationRepository.create(notification)
          )
        );
      }

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
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";
      logger.error(
        "Error en NotificationController->sendNotification: " + errorMsg
      );

      return res.status(500).json({
        message: "Error interno en el servidor",
        error: errorMsg,
      });
    }
  },

  async getUserNotifications(req, res) {
    logger.info(`${req.user.name} - Buscando las notificaciones`);
    try {
      const userId = req.user.id; // ID del usuario autenticado
      const { limit = 5, cursor } = req.body;

      const { notifications, hasMore, nextCursor } =
        await NotificationRepository.getUserNotifications(userId, limit, cursor);

      res.json({
        notifications,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching notifications" });
    }
    /*try {
      const userId = req.user.id; // Obtener el ID del usuario autenticado
  
      const notifications = await NotificationRepository.getUserNotifications(userId);
  
      return res.status(200).json({ notifications:notifications });
    } catch (error) {
      const errorMsg = error.details?.map(detail => detail.message).join(", ") || error.message;
      logger.error("NotificationController->getUserNotifications: " + errorMsg);
      res.status(500).json({ error: "ServerError", details: errorMsg });
    }*/
  },
};

module.exports = NotificationController;
