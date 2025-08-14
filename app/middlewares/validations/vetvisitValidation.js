// validations/vetVisit.validation.js
const Joi = require('joi');

const storeVetVisitSchema = Joi.object({
  pet_id: Joi.number().integer().required().messages({
    'number.base': '"pet_id" debe ser un número.',
    'number.integer': '"pet_id" debe ser un número entero.',
    'any.required': '"pet_id" es obligatorio.'
  }),

  date: Joi.date().iso().required().messages({
    'date.base': '"date" debe ser una fecha válida en formato ISO (YYYY-MM-DD).',
    'any.required': '"date" es obligatorio.'
  }),

  vet_name: Joi.string().max(255).required().messages({
    'string.base': '"vet_name" debe ser un texto.',
    'string.max': '"vet_name" no debe exceder {#limit} caracteres.',
    'any.required': '"vet_name" es obligatorio.'
  }),

  clinic: Joi.string().max(255).allow(null, '').optional().messages({
    'string.max': '"clinic" no debe exceder {#limit} caracteres.'
  }),

  reason: Joi.string().allow(null, '').optional().messages({
    'string.base': '"reason" debe ser un texto.'
  }),

  diagnosis: Joi.string().allow(null, '').optional().messages({
    'string.base': '"diagnosis" debe ser un texto.'
  }),

  treatment_given: Joi.string().allow(null, '').optional().messages({
    'string.base': '"treatment_given" debe ser un texto.'
  }),

  recommendations: Joi.string().allow(null, '').optional().messages({
    'string.base': '"recommendations" debe ser un texto.'
  }),

  next_visit: Joi.date().iso().allow(null, '').optional().messages({
    'date.base': '"next_visit" debe ser una fecha válida en formato ISO.'
  }),

  home_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"home_id" debe ser un número entero.'
  }),

  person_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"person_id" debe ser un número entero.'
  }),

  image: Joi.string()
      .pattern(/\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/i)
      .allow(null)
      .empty('')
      .optional()
      .messages({
          'string.pattern.base': 'El archivo debe ser una imagen (jpg, jpeg, png, gif) o un documento (pdf, doc, docx, txt)'
      }),
});

const updateVetVisitSchema = Joi.object({
  pet_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"pet_id" debe ser un número entero.'
  }),

  date: Joi.date().iso().allow(null, '').optional().messages({
    'date.base': '"date" debe ser una fecha válida en formato ISO.'
  }),

  vet_name: Joi.string().max(255).allow(null, '').optional().messages({
    'string.max': '"vet_name" no debe exceder {#limit} caracteres.'
  }),

  clinic: Joi.string().max(255).allow(null, '').optional().messages({
    'string.max': '"clinic" no debe exceder {#limit} caracteres.'
  }),

  reason: Joi.string().allow(null, '').optional().messages({
    'string.base': '"reason" debe ser un texto.'
  }),

  diagnosis: Joi.string().allow(null, '').optional().messages({
    'string.base': '"diagnosis" debe ser un texto.'
  }),

  treatment_given: Joi.string().allow(null, '').optional().messages({
    'string.base': '"treatment_given" debe ser un texto.'
  }),

  recommendations: Joi.string().allow(null, '').optional().messages({
    'string.base': '"recommendations" debe ser un texto.'
  }),

  next_visit: Joi.date().iso().allow(null, '').optional().messages({
    'date.base': '"next_visit" debe ser una fecha válida en formato ISO.'
  }),

  home_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"home_id" debe ser un número entero.'
  }),

  person_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"person_id" debe ser un número entero.'
  }),

  image: Joi.string()
      .pattern(/\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/i)
      .allow(null)
      .empty('')
      .optional()
      .messages({
          'string.pattern.base': 'El archivo debe ser una imagen (jpg, jpeg, png, gif) o un documento (pdf, doc, docx, txt)'
      }),

  id: Joi.number().integer().required().messages({
    'any.required': '"id" es obligatorio para actualizar.',
    'number.integer': '"id" debe ser un número entero.'
  })
}).min(1);

const idVetVisitSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    'any.required': '"id" es obligatorio.',
    'number.integer': '"id" debe ser un número entero.'
  })
});

const getVetVisitsSchema = Joi.object({
  pet_id: Joi.number().integer().allow(null, '').optional(),
  home_id: Joi.number().integer().allow(null, '').optional(),
  person_id: Joi.number().integer().allow(null, '').optional(),
  date: Joi.date().iso().allow(null, '').optional(),
  next_visit: Joi.date().iso().allow(null, '').optional(),
  vet_name: Joi.string().max(255).allow(null, '').optional(),
  clinic: Joi.string().max(255).allow(null, '').optional(),
  diagnosis: Joi.string().allow(null, '').optional()
});

module.exports = {
  storeVetVisitSchema,
  updateVetVisitSchema,
  idVetVisitSchema,
  getVetVisitsSchema
};