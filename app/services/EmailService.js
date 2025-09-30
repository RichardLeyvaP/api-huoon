require("dotenv").config();
const nodemailer = require("nodemailer");
const logger = require("../../config/logger");

const accountTransport = require("../../config/account_transport.json");

async function sendEmail({ to, subject, text, html }) {
  try {
    logger.info("Enviando correo a:", to);

    // ✅ Crea el transportador SIN pasar accessToken manualmente
    const transporter = nodemailer.createTransport({
      service: accountTransport.service,
      auth: {
        type: accountTransport.auth.type,
        user: accountTransport.auth.user,
        clientId: accountTransport.auth.clientId,
        clientSecret: accountTransport.auth.clientSecret,
        refreshToken: accountTransport.auth.refreshToken,
        redirectUri: accountTransport.auth.redirectUri
      },
    });

    const mailOptions = {
      from: `Remitente <${accountTransport.auth.user}>`,
      to,
      subject,
      text,
      html,
    };

    // ✅ Usa await con transporter.sendMail (Nodemailer v6+ soporta promesas)
    const info = await transporter.sendMail(mailOptions);
    logger.info("Correo enviado:", info.response);

    return info;
  } catch (error) {
    logger.error("Error al enviar el correo:", error.message || error);
    throw error;
  }
}

module.exports = { sendEmail };