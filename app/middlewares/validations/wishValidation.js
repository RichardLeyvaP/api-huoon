const Joi = require("joi");

// Esquema para crear un nuevo deseo (wish)
const storeWishSchema = Joi.object({
  name: Joi.string().max(255).required().messages({
    "string.base": "El nombre debe ser una cadena de texto",
    "string.empty": "El nombre no puede estar vacío",
    "any.required": "El nombre es requerido",
  }),
  description: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La descripción debe ser una cadena de texto",
  }),
  type: Joi.string().required().messages({
    "string.base": "El tipo debe ser una cadena de texto",
    "any.required": "El tipo es requerido",
  }),
  date: Joi.date().iso().optional().allow(null).messages({
    "date.base": "La fecha debe ser una fecha válida",
    "date.format": "La fecha debe estar en formato ISO (YYYY-MM-DD)",
  }),
  end: Joi.date().iso().optional().allow(null).messages({
    "date.base": "La fecha límite debe ser una fecha válida",
    "date.format": "La fecha límite debe estar en formato ISO (YYYY-MM-DD)",
  }),
  location: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La ubicación debe ser una cadena de texto",
  }),
  parent_id: Joi.number().integer().optional().allow(null).messages({
    "number.base": "El parent_id debe ser un número",
  }),
  home_id: Joi.number().integer().required().messages({
    "number.base": "El home_id debe ser un número",
    "any.required": "El home_id es requerido",
  }),
  priority_id: Joi.number().integer().required().messages({
    "number.base": "El priority_id debe ser un número",
    "any.required": "El priority_id es requerido",
  }),
  status_id: Joi.number().integer().optional().messages({
    "number.base": "El status_id debe ser un número",
  }),
});

// Esquema para actualizar un deseo (wish)
const updateWishSchema = Joi.object({
  name: Joi.string().max(255).optional().messages({
    "string.base": "El nombre debe ser una cadena de texto",
    "string.empty": "El nombre no puede estar vacío",
  }),
  description: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La descripción debe ser una cadena de texto",
  }),
  type: Joi.string().optional().messages({
    "string.base": "El tipo debe ser una cadena de texto",
  }),
  date: Joi.date().iso().optional().allow(null).messages({
    "date.base": "La fecha debe ser una fecha válida",
    "date.format": "La fecha debe estar en formato ISO (YYYY-MM-DD)",
  }),
  end: Joi.date().iso().optional().allow(null).messages({
    "date.base": "La fecha límite debe ser una fecha válida",
    "date.format": "La fecha límite debe estar en formato ISO (YYYY-MM-DD)",
  }),
  location: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "La ubicación debe ser una cadena de texto",
  }),
  parent_id: Joi.number().integer().optional().allow(null).messages({
    "number.base": "El parent_id debe ser un número",
  }),
  person_id: Joi.number().integer().optional().messages({
    "number.base": "El person_id debe ser un número",
  }),
  home_id: Joi.number().integer().optional().messages({
    "number.base": "El home_id debe ser un número",
  }),
  priority_id: Joi.number().integer().optional().messages({
    "number.base": "El priority_id debe ser un número",
  }),
  status_id: Joi.number().integer().optional().messages({
    "number.base": "El status_id debe ser un número",
  }),
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});



// Esquema para validar el ID de un deseo (wish)
const idWishSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});

// Esquema para validar el home_id en consultas
const getWishSchema = Joi.object({
  home_id: Joi.number().integer().required().messages({
    "number.base": "El home_id debe ser un número",
    "any.required": "El home_id es requerido",
  }),
  type: Joi.string().required(),
});

module.exports = {
  storeWishSchema,
  updateWishSchema,
  idWishSchema,
  getWishSchema,
};