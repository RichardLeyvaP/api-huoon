const Joi = require("joi");

// Esquema para crear una nueva sugerencia
const storeSuggestionSchema = Joi.object({
  home_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del hogar debe ser un número",
  }),
  person_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del hogar debe ser un número",
  }),
   date: Joi.date().optional().allow(null).messages({
        "date.base": "La fecha de inicio debe ser una fecha válida",
      }),
  title: Joi.string().max(255).required().messages({
    "string.base": "El título debe ser una cadena de texto",
    "string.max": "El título no debe exceder los 255 caracteres",
    "any.required": "El título es requerido",
  }),
  description: Joi.string().allow(null, "").optional().messages({
    "string.base": "La descripción debe ser una cadena de texto",
  }),
  content: Joi.string().allow(null, "").optional().messages({
    "string.base": "El contenido debe ser una cadena de texto",
  }),
  status: Joi.string().optional().messages({
    "string.base": "El estado debe ser una cadena de texto",
    "any.only": "El estado debe ser uno de: pending, reviewed, approved, rejected",
  }),
  type: Joi.string().allow(null).optional().messages({ // Nuevo campo
    "string.base": "El tipo debe ser una cadena de texto",
  }),
  typeTask: Joi.string().optional().allow(null, '').messages({
    "string.base": "El tipo de tarea debe ser una cadena de texto"
  }),
});

// Esquema para actualizar una sugerencia
const updateSuggestionSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID de la sugerencia debe ser un número",
    "any.required": "El ID de la sugerencia es requerido",
  }),
  home_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del hogar debe ser un número",
  }),
  person_id: Joi.number().integer().optional().messages({
    "number.base": "El ID de la persona debe ser un número",
  }),
  date: Joi.date().optional().allow(null).messages({
        "date.base": "La fecha de inicio debe ser una fecha válida",
      }),
  title: Joi.string().max(255).optional().messages({
    "string.base": "El título debe ser una cadena de texto",
    "string.max": "El título no debe exceder los 255 caracteres",
  }),
  description: Joi.string().allow(null, "").optional().messages({
    "string.base": "La descripción debe ser una cadena de texto",
  }),
  content: Joi.string().allow(null, "").optional().messages({
    "string.base": "El contenido debe ser una cadena de texto",
  }),
  status: Joi.string().optional().messages({
    "string.base": "El estado debe ser una cadena de texto",
    "any.only": "El estado debe ser uno de: pending, reviewed, approved, rejected",
  }),
  type: Joi.string().allow(null).optional().messages({ // Nuevo campo
    "string.base": "El tipo debe ser una cadena de texto",
  }),
  typeTask: Joi.string().optional().allow(null, '').messages({
    "string.base": "El tipo de tarea debe ser una cadena de texto"
  }),
});

// Esquema para validar el ID de una sugerencia
const idSuggestionSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});

// Esquema para validar el person_id en sugerencias
const getSuggestionByPersonSchema = Joi.object({
  person_id: Joi.number().integer().required().messages({
    "number.base": "El ID de la persona debe ser un número",
    "any.required": "El ID de la persona es requerido",
  }),
});

module.exports = {
  storeSuggestionSchema,
  updateSuggestionSchema,
  idSuggestionSchema,
  getSuggestionByPersonSchema,
};
