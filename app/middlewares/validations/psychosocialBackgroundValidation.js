const Joi = require("joi");

// Schema for creating a new psychosocial background record
const storePsychosocialBackgroundSchema = Joi.object({
  person_id: Joi.number().integer().optional().messages({
    "number.base": '"person_id" debe ser un número válido',
  }),
  date: Joi.date().required().messages({
    "date.base": '"date" debe ser una fecha válida',
    "any.required": '"date" es un campo obligatorio',
  }),
  occupation: Joi.string().max(100).allow(null, '').optional().messages({
    "string.base": '"occupation" debe ser una cadena de texto',
    "string.max": '"occupation" no debe exceder los 100 caracteres'
  }),
  educational_level: Joi.string().allow(null, '').optional().messages({
    "string.base": '"educational_level" debe ser una cadena de texto',
    }),
  tobacco_use: Joi.string().allow(null, '').optional().messages({
    "string.base": '"tobacco_use" debe ser una cadena de texto',
  }),
  alcohol_use: Joi.string().allow(null, '').optional().messages({
    "string.base": '"alcohol_use" debe ser una cadena de texto',
  }),
  drug_use: Joi.string().allow(null, '').optional().messages({
    "string.base": '"drug_use" debe ser una cadena de texto',
  }),
  physical_activity: Joi.string().allow(null, '').optional().messages({
    "string.base": '"physical_activity" debe ser una cadena de texto',
  }),
  family_support: Joi.string().allow(null, '').optional().messages({
    "string.base": '"family_support" debe ser una cadena de texto',
  }),
  traumatic_events: Joi.string().allow(null, '').optional().messages({
    "string.base": '"traumatic_events" debe ser una cadena de texto',
  }),
  mental_health: Joi.string().allow(null, '').optional().messages({
    "string.base": '"mental_health" debe ser una cadena de texto',
  })
});

// Schema for updating a psychosocial background record
const updatePsychosocialBackgroundSchema = Joi.object({
  person_id: Joi.number().integer().optional().messages({
    "number.base": '"person_id" debe ser un número válido',
  }),
  date: Joi.date().optional().messages({
    "date.base": '"date" debe ser una fecha válida',
  }),
  occupation: Joi.string().max(100).allow(null, '').optional().messages({
    "string.base": '"occupation" debe ser una cadena de texto',
    "string.max": '"occupation" no debe exceder los 100 caracteres'
  }),
  educational_level: Joi.string().allow(null, '').optional().messages({
    "string.base": '"educational_level" debe ser una cadena de texto',
    }),
  tobacco_use: Joi.string().allow(null, '').optional().messages({
    "string.base": '"tobacco_use" debe ser una cadena de texto',
  }),
  alcohol_use: Joi.string().allow(null, '').optional().messages({
    "string.base": '"alcohol_use" debe ser una cadena de texto',
  }),
  drug_use: Joi.string().allow(null, '').optional().messages({
    "string.base": '"drug_use" debe ser una cadena de texto',
  }),
  physical_activity: Joi.string().allow(null, '').optional().messages({
    "string.base": '"physical_activity" debe ser una cadena de texto',
  }),
  family_support: Joi.string().allow(null, '').optional().messages({
    "string.base": '"family_support" debe ser una cadena de texto',
  }),
  traumatic_events: Joi.string().allow(null, '').optional().messages({
    "string.base": '"traumatic_events" debe ser una cadena de texto',
  }),
  mental_health: Joi.string().allow(null, '').optional().messages({
    "string.base": '"mental_health" debe ser una cadena de texto',
  }),
  id: Joi.number().integer().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es un campo obligatorio',
  }),
});

// Schema for validating a psychosocial background ID
const idPsychosocialBackgroundSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es un campo obligatorio',
  }),
});

// Schema for getting psychosocial backgrounds by person_id
const getPsychosocialBackgroundSchema = Joi.object({
  person_id: Joi.number().integer().required().messages({
    "number.base": '"person_id" debe ser un número válido',
    "any.required": '"person_id" es un campo obligatorio',
  }),
});

module.exports = {
  storePsychosocialBackgroundSchema,
  updatePsychosocialBackgroundSchema,
  idPsychosocialBackgroundSchema,
  getPsychosocialBackgroundSchema,
};