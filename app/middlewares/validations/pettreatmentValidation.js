const Joi = require('joi');

// Esquema para crear un tratamiento de mascota
const storePetTreatmentSchema = Joi.object({
  type: Joi.string()
    .valid('vaccination', 'deworming')
    .required()
    .messages({
      'any.only': '"type" debe ser "vaccination" o "deworming".',
      'any.required': '"type" es obligatorio.'
    }),

  name: Joi.string().max(255).required().messages({
    'string.base': '"name" debe ser un texto.',
    'string.max': '"name" no debe exceder {#limit} caracteres.',
    'any.required': '"name" es obligatorio.'
  }),

  dosage: Joi.number()
  .precision(2)
  .when('type', {
    is: 'deworming',
    then: Joi.number()
      .required()
      .positive()
      .messages({
        'number.base': '"dosage" debe ser un número.',
        'number.positive': '"dosage" debe ser un número positivo.',
        'any.required': '"dosage" es obligatorio para desparacitaciones.'
      }),
    otherwise: Joi.number().allow(null).optional()
  }),

unit: Joi.string()
  .max(10)
  .when('type', {
    is: 'deworming',
    then: Joi.string()
      .required()
      .valid('mg', 'ml', 'g', 'gr', 'kg', 'l')
      .messages({
        'any.only': '"unit" debe ser una unidad válida (mg, ml, g, etc.).',
        'any.required': '"unit" es obligatorio para desparacitaciones.'
      }),
    otherwise: Joi.string().allow(null).optional()
  }),

  date: Joi.date().iso().required().messages({
    'date.base': '"date" debe ser una fecha válida en formato ISO (YYYY-MM-DD).',
    'any.required': '"date" es obligatorio.'
  }),

  next_date: Joi.date().iso().allow(null, '').optional().messages({
    'date.base': '"next_date" debe ser una fecha válida en formato ISO.'
  }),

  notes: Joi.string().allow(null, '').optional().messages({
    'string.base': '"notes" debe ser un texto.'
  }),

  pet_id: Joi.number().integer().required().messages({
    'number.base': '"pet_id" debe ser un número.',
    'number.integer': '"pet_id" debe ser un número entero.',
    'any.required': '"pet_id" es obligatorio.'
  }),

  home_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"home_id" debe ser un número entero.'
  }),

  person_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"person_id" debe ser un número entero.'
  })
});

// Esquema para actualizar un tratamiento de mascota
const updatePetTreatmentSchema = Joi.object({
  type: Joi.string()
    .valid('vaccination', 'deworming')
    .optional()
    .messages({
      'any.only': '"type" debe ser "vaccination" o "deworming".'
    }),

  name: Joi.string().max(255).allow(null, '').optional().messages({
    'string.max': '"name" no debe exceder {#limit} caracteres.'
  }),

  dosage: Joi.number()
  .precision(2)
  .when('type', {
    is: 'deworming',
    then: Joi.number()
      .required()
      .positive()
      .messages({
        'number.base': '"dosage" debe ser un número.',
        'number.positive': '"dosage" debe ser un número positivo.',
        'any.required': '"dosage" es obligatorio para desparacitaciones.'
      }),
    otherwise: Joi.number().allow(null).optional()
  }),

unit: Joi.string()
  .max(10)
  .when('type', {
    is: 'deworming',
    then: Joi.string()
      .required()
      .valid('mg', 'ml', 'g', 'gr', 'kg', 'l')
      .messages({
        'any.only': '"unit" debe ser una unidad válida (mg, ml, g, etc.).',
        'any.required': '"unit" es obligatorio para desparacitaciones.'
      }),
    otherwise: Joi.string().allow(null).optional()
  }),

  date: Joi.date().iso().allow(null, '').optional().messages({
    'date.base': '"date" debe ser una fecha válida en formato ISO.'
  }),

  next_date: Joi.date().iso().allow(null, '').optional().messages({
    'date.base': '"next_date" debe ser una fecha válida en formato ISO.'
  }),

  notes: Joi.string().allow(null, '').optional().messages({
    'string.base': '"notes" debe ser un texto.'
  }),

  pet_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"pet_id" debe ser un número entero.'
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
}).min(1); // Al menos un campo debe estar presente

// Esquema para obtener un tratamiento por ID
const idPetTreatmentSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    'any.required': '"id" es obligatorio.',
    'number.integer': '"id" debe ser un número entero.'
  })
});

// Esquema para búsqueda con filtros (listado)
const getPetTreatmentsSchema = Joi.object({
  pet_id: Joi.number().integer().allow(null, '').optional(),
  home_id: Joi.number().integer().allow(null, '').optional(),
  person_id: Joi.number().integer().allow(null, '').optional(),
  date: Joi.date().iso().allow(null, '').optional(),
  next_date: Joi.date().iso().allow(null, '').optional(),
  type: Joi.string().valid('vaccination', 'deworming').allow(null, '').optional(),
  name: Joi.string().max(255).allow(null, '').optional()
});

module.exports = {
  storePetTreatmentSchema,
  updatePetTreatmentSchema,
  idPetTreatmentSchema,
  getPetTreatmentsSchema
};