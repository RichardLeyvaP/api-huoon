const Joi = require("joi");

// Esquema para crear un nuevo antecedente personal
const storePersonalBackgroundSchema = Joi.object({
  type_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del tipo debe ser un número",
  }),
  description: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La descripción debe ser una cadena de texto",
    "string.max": "La descripción no debe exceder los 200 caracteres"
  }),
  typeDetail: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La descripción debe ser una cadena de texto",
    "string.max": "La descripción no debe exceder los 50 caracteres"
  }),
  details: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "Los detalles deben ser una cadena de texto",
  }),
  startDate: Joi.date().optional().allow(null).messages({
    "date.base": "La fecha de inicio debe ser una fecha válida",
  }),
  endDate: Joi.date().optional().allow(null).messages({
    "date.base": "La fecha de fin debe ser una fecha válida",
  }),
  status: Joi.string().optional().default('active').messages({
    "string.base": "El estado debe ser una cadena de texto",
    "any.only": "El estado debe ser uno de: active, inactive, resolved"
  }),
  severity: Joi.string().optional().allow(null).messages({
    "string.base": "La severidad debe ser una cadena de texto",
    "any.only": "La severidad debe ser uno de: mild, moderate, severe"
  })
});

// Esquema para actualizar un antecedente personal
const updatePersonalBackgroundSchema = Joi.object({
  type_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del tipo debe ser un número",
  }),
  description: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La descripción debe ser una cadena de texto",
    "string.max": "La descripción no debe exceder los 200 caracteres"
  }),
  typeDetail: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La descripción debe ser una cadena de texto",
    "string.max": "La descripción no debe exceder los 50 caracteres"
  }),
  details: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "Los detalles deben ser una cadena de texto",
  }),
  startDate: Joi.date().optional().allow(null).messages({
    "date.base": "La fecha de inicio debe ser una fecha válida",
  }),
  endDate: Joi.date().optional().allow(null).messages({
    "date.base": "La fecha de fin debe ser una fecha válida",
  }),
  status: Joi.string().optional().messages({
    "string.base": "El estado debe ser una cadena de texto",
    "any.only": "El estado debe ser uno de: active, inactive, resolved"
  }),
  severity: Joi.string().optional().allow(null).messages({
    "string.base": "La severidad debe ser una cadena de texto",
    "any.only": "La severidad debe ser uno de: mild, moderate, severe"
  }),
  id: Joi.number().integer().required().messages({
    "number.base": "El ID del antecedente debe ser un número",
    "any.required": "El ID del antecedente es requerido",
  })
});

// Esquema para validar el ID de un antecedente personal
const idPersonalBackgroundSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});

// Esquema para validar el person_id en antecedentes personales
const getPersonalBackgroundSchema = Joi.object({
  person_id: Joi.number().integer().required().messages({
    "number.base": "El ID de la persona debe ser un número",
    "any.required": "El ID de la persona es requerido",
  }),
});

module.exports = {
  storePersonalBackgroundSchema,
  updatePersonalBackgroundSchema,
  idPersonalBackgroundSchema,
  getPersonalBackgroundSchema,
};