const Joi = require("joi");

// Schema for creating a new treatment
const storeTreatmentSchema = Joi.object({
  medical_consultation_id: Joi.number().integer().allow(null).optional().messages({
    "number.base": "El ID de la consulta médica debe ser un número",
  }),
  medication: Joi.string().max(100).allow(null, "").optional().messages({
    "string.base": "El medicamento debe ser una cadena de texto",
    "string.max": "El medicamento no debe exceder los 100 caracteres"
  }),
  dosage: Joi.string().max(50).allow(null, "").optional().messages({
    "string.base": "La dosis debe ser una cadena de texto",
    "string.max": "La dosis no debe exceder los 50 caracteres"
  }),
  frequency: Joi.string().max(50).allow(null, "").optional().messages({
    "string.base": "La frecuencia debe ser una cadena de texto",
    "string.max": "La frecuencia no debe exceder los 50 caracteres"
  }),
  duration: Joi.string().max(50).allow(null, "").optional().messages({
    "string.base": "La duración debe ser una cadena de texto",
    "string.max": "La duración no debe exceder los 50 caracteres"
  }),
  instructions: Joi.string().allow(null, "").optional().messages({
    "string.base": "Las instrucciones deben ser una cadena de texto",
  }),
  purpose: Joi.string().allow(null, "").optional().messages({
    "string.base": "El propósito debe ser una cadena de texto",
  }),
  startDate: Joi.date().allow(null).optional().messages({
    "date.base": "La fecha de inicio debe ser una fecha válida",
  }),
  endDate: Joi.date().allow(null).optional().messages({
    "date.base": "La fecha de fin debe ser una fecha válida",
  })
});

// Schema for updating a treatment
const updateTreatmentSchema = Joi.object({
  medical_consultation_id: Joi.number().integer().allow(null).optional().messages({
    "number.base": "El ID de la consulta médica debe ser un número",
  }),
  medication: Joi.string().max(100).allow(null, "").optional().messages({
    "string.base": "El medicamento debe ser una cadena de texto",
    "string.max": "El medicamento no debe exceder los 100 caracteres"
  }),
  dosage: Joi.string().max(50).allow(null, "").optional().messages({
    "string.base": "La dosis debe ser una cadena de texto",
    "string.max": "La dosis no debe exceder los 50 caracteres"
  }),
  frequency: Joi.string().max(50).allow(null, "").optional().messages({
    "string.base": "La frecuencia debe ser una cadena de texto",
    "string.max": "La frecuencia no debe exceder los 50 caracteres"
  }),
  duration: Joi.string().max(50).allow(null, "").optional().messages({
    "string.base": "La duración debe ser una cadena de texto",
    "string.max": "La duración no debe exceder los 50 caracteres"
  }),
  instructions: Joi.string().allow(null, "").optional().messages({
    "string.base": "Las instrucciones deben ser una cadena de texto",
  }),
  purpose: Joi.string().allow(null, "").optional().messages({
    "string.base": "El propósito debe ser una cadena de texto",
  }),
  startDate: Joi.date().allow(null).optional().messages({
    "date.base": "La fecha de inicio debe ser una fecha válida",
  }),
  endDate: Joi.date().allow(null).optional().messages({
    "date.base": "La fecha de fin debe ser una fecha válida",
  }),
  id: Joi.number().integer().required().messages({
    "number.base": "El ID del tratamiento debe ser un número",
    "any.required": "El ID del tratamiento es requerido",
  })
});

// Schema for validating a treatment ID
const idTreatmentSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});

// Schema for validating person_id in treatments
const getTreatmentSchema = Joi.object({
  person_id: Joi.number().integer().required().messages({
    "number.base": "El ID de la persona debe ser un número",
    "any.required": "El ID de la persona es requerido",
  }),
});

module.exports = {
  storeTreatmentSchema,
  updateTreatmentSchema,
  idTreatmentSchema,
  getTreatmentSchema,
};