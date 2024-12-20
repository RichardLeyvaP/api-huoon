const logger = require("../../config/logger");
const Joi = require('joi'); // Asegúrate de usar Joi para validaciones

const validateSchema = (schema) => {
  return (req, res, next) => {
    // Si Multer procesó la imagen, ahora los datos deben estar en req.body
    if (req.file) {
      console.log('Archivo recibido:', req.file);  // Aquí puedes ver los detalles del archivo
    }

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      logger.error(
        `Validation error in ${req.method} ${req.originalUrl} - Body: ${JSON.stringify(req.body)} - Errors: ${error.details
          .map((err) => err.message)
          .join(", ")}`
      );

      return res.status(400).json({
        message: "Error de validación",
        details: error.details.map((err) => err.message),
      });
    }

    next();
  };
};

module.exports = validateSchema;
