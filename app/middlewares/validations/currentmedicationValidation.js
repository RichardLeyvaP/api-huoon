// validations/currentMedication.validation.js
const Joi = require('joi');

const storeCurrentMedicationSchema = Joi.object({
  pet_id: Joi.number().integer().required().messages({
    'number.base': '"pet_id" debe ser un número.',
    'number.integer': '"pet_id" debe ser un número entero.',
    'any.required': '"pet_id" es obligatorio.'
  }),

  name: Joi.string().max(255).required().messages({
    'string.base': '"name" debe ser un texto.',
    'string.max': '"name" no debe exceder {#limit} caracteres.',
    'any.required': '"name" es obligatorio.'
  }),

  dosage: Joi.number().precision(2).allow(null, '').optional().messages({
    'number.base': '"dosage" debe ser un número.',
    'number.precision': '"dosage" no debe tener más de 2 decimales.'
  }),

  unit: Joi.string().max(20).allow(null, '').optional().messages({
    'string.max': '"unit" no debe exceder {#limit} caracteres.'
  }),

  type_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"type_id" debe ser un número entero.'
  }),

  route: Joi.string().max(50).allow(null, '').optional().messages({
    'string.max': '"route" no debe exceder {#limit} caracteres.'
  }),

  start_date: Joi.date().iso().required().messages({
    'date.base': '"start_date" debe ser una fecha válida en formato ISO.',
    'any.required': '"start_date" es obligatorio.'
  }),

  end_date: Joi.date().iso().allow(null, '').optional().greater(Joi.ref('start_date')).messages({
    'date.greater': '"end_date" debe ser posterior a "start_date".',
    'date.base': '"end_date" debe ser una fecha válida en formato ISO.'
  }),

  notes: Joi.string().allow(null, '').optional().messages({
    'string.base': '"notes" debe ser un texto.'
  }),

  prescribed_by: Joi.string().max(255).allow(null, '').optional().messages({
    'string.max': '"prescribed_by" no debe exceder {#limit} caracteres.'
  }),

  home_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"home_id" debe ser un número entero.'
  }),

  person_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"person_id" debe ser un número entero.'
  })
});

const updateCurrentMedicationSchema = Joi.object({
  pet_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"pet_id" debe ser un número entero.'
  }),

  name: Joi.string().max(255).allow(null, '').optional().messages({
    'string.max': '"name" no debe exceder {#limit} caracteres.'
  }),

  dosage: Joi.number().precision(2).allow(null, '').optional().messages({
    'number.base': '"dosage" debe ser un número.'
  }),

  unit: Joi.string().max(20).allow(null, '').optional().messages({
    'string.max': '"unit" no debe exceder {#limit} caracteres.'
  }),

  type_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"type_id" debe ser un número entero.'
  }),

  route: Joi.string().max(50).allow(null, '').optional().messages({
    'string.max': '"route" no debe exceder {#limit} caracteres.'
  }),

  start_date: Joi.date().iso().allow(null, '').optional().messages({
    'date.base': '"start_date" debe ser una fecha válida en formato ISO.'
  }),

  end_date: Joi.date().iso().allow(null, '').optional().greater(Joi.ref('start_date')).messages({
    'date.greater': '"end_date" debe ser posterior a "start_date".'
  }),

  notes: Joi.string().allow(null, '').optional().messages({
    'string.base': '"notes" debe ser un texto.'
  }),

  prescribed_by: Joi.string().max(255).allow(null, '').optional().messages({
    'string.max': '"prescribed_by" no debe exceder {#limit} caracteres.'
  }),

  home_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"home_id" debe ser un número entero.'
  }),

  person_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"person_id" debe ser un número entero.'
  }),

  id: Joi.number().integer().required().messages({
    'any.required': '"id" es obligatorio para actualizar.',
    'number.integer': '"id" debe ser un número entero.'
  })
}).min(1);

const idCurrentMedicationSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    'any.required': '"id" es obligatorio.',
    'number.integer': '"id" debe ser un número entero.'
  })
});

const getCurrentMedicationsSchema = Joi.object({
  pet_id: Joi.number().integer().allow(null, '').optional(),
  home_id: Joi.number().integer().allow(null, '').optional(),
  person_id: Joi.number().integer().allow(null, '').optional(),
  start_date: Joi.date().iso().allow(null, '').optional(),
  end_date: Joi.date().iso().allow(null, '').optional(),
  medication_name: Joi.string().max(255).allow(null, '').optional(),
  type_id: Joi.number().integer().allow(null, '').optional(),
  route: Joi.string().max(50).allow(null, '').optional(),
  active: Joi.boolean().optional()
});

module.exports = {
  storeCurrentMedicationSchema,
  updateCurrentMedicationSchema,
  idCurrentMedicationSchema,
  getCurrentMedicationsSchema
};