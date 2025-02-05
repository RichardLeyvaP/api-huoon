const admin = require("firebase-admin");

const NotificationRepository = {
  async sendNotification(body) {
    const { token, data} = body;
    const message = {
    notification: {
            title: data.title,
            body: data.body
          },
      data: {
        route: '/ChatPage',
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
};

module.exports = NotificationRepository;
