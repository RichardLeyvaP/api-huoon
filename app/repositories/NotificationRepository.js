const admin = require("firebase-admin");
const { Notification, Home, Sequelize,  } = require("../models"); // Asegúrate de importar tu modelo
const logger = require("../../config/logger");

const NotificationRepository = {
  async sendNotification(body) {
    const { token, data } = body;
    const message = {
      notification: {
        title: data.title,
        body: data.body,
      },
      data: {
        route: "/ChatPage",
      },
      tokens: token,
    };
    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async create(body, t = null) {
    logger.info(
      "Creando notificación con los siguientes datos:",
      JSON.stringify(body, null, 2)
    ); // Serializa body para logging

    const {
      home_id,
      user_id,
      title,
      description,
      data,
      route,
      status,
      firebaseId,
    } = body;

    // Validar que `data` sea un string
    const validData = typeof data === "string" ? data : JSON.stringify(data);

    try {
      // Crear la notificación en la base de datos
      const notification = await Notification.create(
        {
          home_id,
          user_id,
          title,
          description,
          data: validData, // Usamos el valor validado
          route,
          status: status || 0, // Valor por defecto
          firebaseId,
        },
        { transaction: t }
      );

      return notification; // Retorna el objeto creado
    } catch (error) {
      logger.error(`Error en NotificationRepository->create: ${error.message}`);
      throw error;
    }
  },

  async getUserNotifications(userId, limit = 10, cursor = null) {
    try {
      const whereCondition = {
        user_id: userId,
      };

      if (cursor) {
        whereCondition.createdAt = { [Sequelize.Op.lt]: new Date(cursor) };
      }

      const notifications = await Notification.findAll({
        where: whereCondition,
        include: [
          {
              model: Home,
              as: "home", // Incluir persona si también es necesario
              atributes: ['name', 'image']
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit) + 1, // +1 para determinar si hay más
      });

      const hasMore = notifications.length > limit;
      if (hasMore) notifications.pop(); // Quitar la extra

      const nextCursor = hasMore
        ? notifications[notifications.length - 1].createdAt.toISOString()
        : null;

         // Mapear las notificaciones al formato deseado
      const mappedNotifications = notifications.map((notification) => ({
        id: notification.id,
        user_id: notification.user_id,
        home_id: notification.home_id,
        userId: notification.user_id,
        homeId: notification.home_id,
        nameHome: notification.home.name,
        image: notification.home.image,
        data: JSON.parse(notification.data),
        title: notification.title,
        description: notification.description,
        createdAt: notification.createdAt.toISOString(),  // Convertir la fecha a formato ISO
        status: notification.status,  // Suponiendo que 'read' es un campo en tu modelo
        // Otros campos que puedas necesitar
      }));

      return { notifications: mappedNotifications, hasMore, nextCursor };
    } catch (error) {
      console.error("Error en getNotificationsByUser:", error);
      throw error;
    }
    /*try {
      const notifications = await Notification.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']] // Ordenar por las más recientes
      });
  
      // Convertir `data` de string JSON a objeto y extraer `nameHome`
    return notifications.map(notification => {
      const parsedData = notification.data ? JSON.parse(notification.data) : {};

      return {
        ...notification.toJSON(),
        data: parsedData, // Mantiene el objeto `data`
        nameHome: parsedData.nameHome || null // Extrae `nameHome` afuera
      };
    });
    } catch (error) {
      logger.error(`Error en NotificationRepository->getUserNotifications: ${error.message}`);
      throw error;
    }*/
  },

  async sendNotificationMultiCast(notifications) {
    try {
      const firebaseResults = await Promise.all(
        notifications.map(async (notification) => {
          const { token, notification: notifData, data } = notification;

          // Verificar si token es un array y convertirlo en uno válido
          const tokensArray = Array.isArray(token) ? token : [token];

          // Estructura del mensaje
          const message = {
            notification: {
              title: notifData.title || "Sin título",
              body: notifData.body || "Sin contenido",
            },
            data: {
              route: data.route || "/",
              home_id: data.home_id || "",
              nameHome: data.nameHome || "",
              role_id: data.role_id || "",
              roleName: data.roleName || "",
            },
            tokens: tokensArray, // Enviar a múltiples dispositivos
          };

          try {
            const response = await admin
              .messaging()
              .sendEachForMulticast(message);
            return { success: true, response };
          } catch (error) {
            return { success: false, error: error.message };
          }
        })
      );

      return firebaseResults;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

module.exports = NotificationRepository;
