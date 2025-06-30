const Joi = require("joi");

// Schema for creating a new diagnosis
const storeDiagnosisSchema = Joi.object({
  medical_consultation_id: Joi.number().integer().allow(null).optional().messages({
    "number.base": "El ID de la consulta médica debe ser un número",
  }),
  type_id: Joi.number().integer().allow(null).optional().messages({
    "number.base": "El ID del tipo debe ser un número",
  }),
  date: Joi.date().optional().messages({
      "date.base": '"date" debe ser una fecha válida',
    }),
  description: Joi.string().required().messages({
    "string.base": "La descripción debe ser una cadena de texto",
  }),
  cie10_code: Joi.string().max(20).allow(null, "").optional().messages({
    "string.base": "El código CIE-10 debe ser una cadena de texto",
    "string.max": "El código CIE-10 no debe exceder los 20 caracteres"
  }),
  notes: Joi.string().allow(null, "").optional().messages({
    "string.base": "Las notas deben ser una cadena de texto",
  })
});

// Schema for updating a diagnosis
const updateDiagnosisSchema = Joi.object({
  medical_consultation_id: Joi.number().integer().allow(null).optional().messages({
    "number.base": "El ID de la consulta médica debe ser un número",
  }),
  type_id: Joi.number().integer().allow(null).optional().messages({
    "number.base": "El ID del tipo debe ser un número",
  }),
  date: Joi.date().optional().messages({
      "date.base": '"date" debe ser una fecha válida',
    }),
  description: Joi.string().optional().messages({
    "string.base": "La descripción debe ser una cadena de texto",
  }),
  cie10_code: Joi.string().max(20).allow(null, "").optional().messages({
    "string.base": "El código CIE-10 debe ser una cadena de texto",
    "string.max": "El código CIE-10 no debe exceder los 20 caracteres"
  }),
  notes: Joi.string().allow(null, "").optional().messages({
    "string.base": "Las notas deben ser una cadena de texto",
  }),
  id: Joi.number().integer().required().messages({
    "number.base": "El ID del diagnóstico debe ser un número",
    "any.required": "El ID del diagnóstico es requerido",
  })
});

// Schema for validating a diagnosis ID
const idDiagnosisSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});

// Schema for validating person_id in diagnoses
const getDiagnosisSchema = Joi.object({
  person_id: Joi.number().integer().required().messages({
    "number.base": "El ID de la persona debe ser un número",
    "any.required": "El ID de la persona es requerido",
  }),
});

module.exports = {
  storeDiagnosisSchema,
  updateDiagnosisSchema,
  idDiagnosisSchema,
  getDiagnosisSchema,
};