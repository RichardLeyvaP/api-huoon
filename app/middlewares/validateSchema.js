const logger = require("../../config/logger");

const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.error(
        `Validation error in ${req.method} ${req.originalUrl} - Errors: ${error.details
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
