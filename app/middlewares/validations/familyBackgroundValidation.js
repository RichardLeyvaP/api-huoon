const Joi = require("joi");

// Esquema para crear un nuevo antecedente familiar
const storeFamilyBackgroundSchema = Joi.object({
  home_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del hogar debe ser un número",
  }),
  type_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del tipo debe ser un número",
  }),
  date: Joi.date().optional().allow(null).messages({
      "date.base": "La fecha de inicio debe ser una fecha válida",
    }),
  relationship: Joi.string().optional().allow(null, "").empty(null).messages({
    "string.base": "El parentesco debe ser una cadena de texto",
  }),
  disease: Joi.string().optional().allow(null, "").empty(null).messages({
    "string.base": "La enfermedad debe ser una cadena de texto",
  }),
  details: Joi.string().allow(null, "").optional().empty("").default(null).messages({
    "string.base": "Los detalles deben ser una cadena de texto",
  }),
  diagnosis_age: Joi.number().integer().min(0).max(120).allow(null).optional().messages({
    "number.base": "La edad de diagnóstico debe ser un número",
    "number.min": "La edad de diagnóstico no puede ser menor a 0",
    "number.max": "La edad de diagnóstico no puede ser mayor a 120",
  })
});

// Esquema para actualizar un antecedente familiar
const updateFamilyBackgroundSchema = Joi.object({
  home_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del hogar debe ser un número",
  }),
  type_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del tipo debe ser un número",
  }),
  date: Joi.date().optional().allow(null).messages({
      "date.base": "La fecha de inicio debe ser una fecha válida",
    }),
  relationship: Joi.string().optional().allow(null, "").empty(null).messages({
    "string.base": "El parentesco debe ser una cadena de texto",
  }),
  disease: Joi.string().optional().allow(null, "").empty(null).messages({
    "string.base": "La enfermedad debe ser una cadena de texto",
  }),
  details: Joi.string().allow(null, "").optional().empty("").default(null).messages({
    "string.base": "Los detalles deben ser una cadena de texto",
  }),
  diagnosis_age: Joi.number().integer().min(0).max(120).allow(null).optional().messages({
    "number.base": "La edad de diagnóstico debe ser un número",
    "number.min": "La edad de diagnóstico no puede ser menor a 0",
    "number.max": "La edad de diagnóstico no puede ser mayor a 120",
  }),
  id: Joi.number().integer().required().messages({
    "number.base": "El ID del antecedente debe ser un número",
    "any.required": "El ID del antecedente es requerido",
  })
});

// Esquema para validar el ID de un antecedente familiar
const idFamilyBackgroundSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});

// Esquema para validar el person_id en antecedentes familiares
const getFamilyBackgroundSchema = Joi.object({
  person_id: Joi.number().integer().required().messages({
    "number.base": "El ID de la persona debe ser un número",
    "any.required": "El ID de la persona es requerido",
  }),
});

module.exports = {
  storeFamilyBackgroundSchema,
  updateFamilyBackgroundSchema,
  idFamilyBackgroundSchema,
  getFamilyBackgroundSchema,
};