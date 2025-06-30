const Joi = require("joi");

// Esquema para crear un nuevo examen físico
const storePhysicalExamSchema = Joi.object({
  person_id: Joi.number().integer().allow(null).optional().messages({
    "number.base": '"person_id" debe ser un número válido',
  }),
  medical_consultation_id: Joi.number().integer().allow(null).optional().messages({
    "number.base": '"medical_consultation_id" debe ser un número válido',
  }),
  blood_pressure: Joi.string().max(20).allow(null, '').optional().messages({
    "string.base": '"blood_pressure" debe ser una cadena de texto',
    "string.max": '"blood_pressure" no debe exceder los 20 caracteres'
  }),
  pulse: Joi.number().integer().min(0).max(300).allow(null).optional().messages({
    "number.base": '"pulse" debe ser un número entero',
    "number.min": '"pulse" debe ser mayor o igual a 0',
    "number.max": '"pulse" debe ser menor o igual a 300'
  }),
  exam_date: Joi.date().required().messages({
    "date.base": '"exam_date" debe ser una fecha válida',
    "any.required": '"exam_date" es un campo obligatorio',
  }),
  respiratory_rate: Joi.number().integer().min(0).max(100).allow(null).optional().messages({
    "number.base": '"respiratory_rate" debe ser un número entero',
    "number.min": '"respiratory_rate" debe ser mayor o igual a 0',
    "number.max": '"respiratory_rate" debe ser menor o igual a 100'
  }),
  temperature: Joi.number().precision(1).min(20).max(45).allow(null).optional().messages({
    "number.base": '"temperature" debe ser un número válido',
    "number.min": '"temperature" debe ser mayor o igual a 20',
    "number.max": '"temperature" debe ser menor o igual a 45',
    "number.precision": '"temperature" debe tener máximo 1 decimal'
  }),
  weight: Joi.number().precision(2).min(0).max(500).allow(null).optional().messages({
    "number.base": '"weight" debe ser un número válido',
    "number.min": '"weight" debe ser mayor o igual a 0',
    "number.max": '"weight" debe ser menor o igual a 500',
    "number.precision": '"weight" debe tener máximo 2 decimales'
  }),
  height: Joi.number().precision(2).min(0).max(3).allow(null).optional().messages({
    "number.base": '"height" debe ser un número válido',
    "number.min": '"height" debe ser mayor o igual a 0',
    "number.max": '"height" debe ser menor o igual a 3',
    "number.precision": '"height" debe tener máximo 2 decimales'
  }),
  bmi: Joi.number().precision(2).min(0).max(100).allow(null).optional().messages({
    "number.base": '"bmi" debe ser un número válido',
    "number.min": '"bmi" debe ser mayor o igual a 0',
    "number.max": '"bmi" debe ser menor o igual a 100',
    "number.precision": '"bmi" debe tener máximo 2 decimales'
  }),
  neurological_observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"neurological_observations" debe ser una cadena de texto',
  }),
  cardiovascular_observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"cardiovascular_observations" debe ser una cadena de texto',
  }),
  respiratory_observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"respiratory_observations" debe ser una cadena de texto',
  }),
  digestive_observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"digestive_observations" debe ser una cadena de texto',
  }),
  urinary_observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"urinary_observations" debe ser una cadena de texto',
  }),
  other_findings: Joi.string().allow(null, '').optional().messages({
    "string.base": '"other_findings" debe ser una cadena de texto',
  })
});

// Esquema para actualizar un examen físico
const updatePhysicalExamSchema = Joi.object({
  person_id: Joi.number().integer().optional().messages({
    "number.base": '"person_id" debe ser un número válido',
  }),
  medical_consultation_id: Joi.number().integer().allow(null).optional().messages({
    "number.base": '"medical_consultation_id" debe ser un número válido',
  }),
  blood_pressure: Joi.string().max(20).allow(null, '').optional().messages({
    "string.base": '"blood_pressure" debe ser una cadena de texto',
    "string.max": '"blood_pressure" no debe exceder los 20 caracteres'
  }),
  pulse: Joi.number().integer().min(0).max(300).allow(null).optional().messages({
    "number.base": '"pulse" debe ser un número entero',
    "number.min": '"pulse" debe ser mayor o igual a 0',
    "number.max": '"pulse" debe ser menor o igual a 300'
  }),
  exam_date: Joi.date().optional().messages({
    "date.base": '"exam_date" debe ser una fecha válida',
  }),
  respiratory_rate: Joi.number().integer().min(0).max(100).allow(null).optional().messages({
    "number.base": '"respiratory_rate" debe ser un número entero',
    "number.min": '"respiratory_rate" debe ser mayor o igual a 0',
    "number.max": '"respiratory_rate" debe ser menor o igual a 100'
  }),
  temperature: Joi.number().precision(1).min(20).max(45).allow(null).optional().messages({
    "number.base": '"temperature" debe ser un número válido',
    "number.min": '"temperature" debe ser mayor o igual a 20',
    "number.max": '"temperature" debe ser menor o igual a 45',
    "number.precision": '"temperature" debe tener máximo 1 decimal'
  }),
  weight: Joi.number().precision(2).min(0).max(500).allow(null).optional().messages({
    "number.base": '"weight" debe ser un número válido',
    "number.min": '"weight" debe ser mayor o igual a 0',
    "number.max": '"weight" debe ser menor o igual a 500',
    "number.precision": '"weight" debe tener máximo 2 decimales'
  }),
  height: Joi.number().precision(2).min(0).max(3).allow(null).optional().messages({
    "number.base": '"height" debe ser un número válido',
    "number.min": '"height" debe ser mayor o igual a 0',
    "number.max": '"height" debe ser menor o igual a 3',
    "number.precision": '"height" debe tener máximo 2 decimales'
  }),
  bmi: Joi.number().precision(2).min(0).max(100).allow(null).optional().messages({
    "number.base": '"bmi" debe ser un número válido',
    "number.min": '"bmi" debe ser mayor o igual a 0',
    "number.max": '"bmi" debe ser menor o igual a 100',
    "number.precision": '"bmi" debe tener máximo 2 decimales'
  }),
  neurological_observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"neurological_observations" debe ser una cadena de texto',
  }),
  cardiovascular_observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"cardiovascular_observations" debe ser una cadena de texto',
  }),
  respiratory_observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"respiratory_observations" debe ser una cadena de texto',
  }),
  digestive_observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"digestive_observations" debe ser una cadena de texto',
  }),
  urinary_observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"urinary_observations" debe ser una cadena de texto',
  }),
  other_findings: Joi.string().allow(null, '').optional().messages({
    "string.base": '"other_findings" debe ser una cadena de texto',
  }),
  id: Joi.number().integer().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es un campo obligatorio',
  }),
});

// Esquema para validar un ID de examen físico
const idPhysicalExamSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es un campo obligatorio',
  }),
});

// Esquema para obtener exámenes físicos por person_id
const getPhysicalExamSchema = Joi.object({
  person_id: Joi.number().integer().required().messages({
    "number.base": '"person_id" debe ser un número válido',
    "any.required": '"person_id" es un campo obligatorio',
  }),
});

module.exports = {
  storePhysicalExamSchema,
  updatePhysicalExamSchema,
  idPhysicalExamSchema,
  getPhysicalExamSchema,
};