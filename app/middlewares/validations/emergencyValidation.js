const Joi = require("joi");

// Esquema para crear una nueva emergencia (Emergency)
const storeEmergencySchema = Joi.object({
  person_id: Joi.number().integer().optional().messages({
    "number.base": "El ID de la persona debe ser un número",
    "any.required": "El ID de la persona es requerido",
  }),
  type_id: Joi.number().integer().required().messages({
    "number.base": "El ID del tipo debe ser un número",
    "any.required": "El ID del tipo es requerido",
  }),
  date: Joi.date().required().messages({
    "date.base": "La fecha de la emergencia debe ser una fecha válida",
    "any.required": "La fecha de la emergencia es requerida",
  }),
  symptoms: Joi.string().required().messages({
    "string.base": "Los síntomas deben ser una cadena de texto",
    "any.required": "Los síntomas son requeridos",
  }),
  actionTaken: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La acción tomada debe ser una cadena de texto",
  }),
  contactAlerted: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().required().messages({
          "number.base": "El ID del contacto debe ser un número",
          "any.required": "El ID del contacto es requerido",
        }),
        name: Joi.string().required().messages({
          "string.base": "El nombre del contacto debe ser una cadena de texto",
          "any.required": "El nombre del contacto es requerido",
        }),
        phone: Joi.string().required().messages({
          "string.base": "El número de teléfono debe ser una cadena de texto",
          "any.required": "El número de teléfono es requerido",
        }),
      })
    )
    .optional(),
  location: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La ubicación debe ser una cadena de texto",
  }),
});

// Esquema para actualizar una emergencia (Emergency)
const updateEmergencySchema = Joi.object({
  person_id: Joi.number().integer().optional().messages({
    "number.base": "El ID de la persona debe ser un número",
  }),
  type_id: Joi.number().integer().optional().messages({
    "number.base": "El ID del tipo debe ser un número",
  }),
  date: Joi.date().optional().messages({
    "date.base": "La fecha de la emergencia debe ser una fecha válida",
  }),
  symptoms: Joi.string().optional().messages({
    "string.base": "Los síntomas deben ser una cadena de texto",
  }),
  actionTaken: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La acción tomada debe ser una cadena de texto",
  }),
  contactAlerted: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().required().messages({
          "number.base": "El ID del contacto debe ser un número",
          "any.required": "El ID del contacto es requerido",
        }),
        name: Joi.string().required().messages({
          "string.base": "El nombre del contacto debe ser una cadena de texto",
          "any.required": "El nombre del contacto es requerido",
        }),
        phone: Joi.string().required().messages({
          "string.base": "El número de teléfono debe ser una cadena de texto",
          "any.required": "El número de teléfono es requerido",
        }),
      })
    )
    .optional(),
  location: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La ubicación debe ser una cadena de texto",
  }),
  id: Joi.number().integer().required().messages({
    "number.base": "El ID de la emergencia debe ser un número",
    "any.required": "El ID de la emergencia es requerido",
  }),
});

// Esquema para validar el ID de una emergencia (Emergency)
const idEmergencySchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});

// Esquema para validar el person_id en emergencias
const getEmergencySchema = Joi.object({
  person_id: Joi.number().integer().optional().messages({
    "number.base": "El ID de la persona debe ser un número",
    "any.required": "El ID de la persona es requerido",
  }),
});

module.exports = {
  storeEmergencySchema,
  updateEmergencySchema,
  idEmergencySchema,
  getEmergencySchema,
};