// validations/petDiet.validation.js
const { get } = require('http');
const Joi = require('joi');

const storePetDietSchema = Joi.object({
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
  
  food_type: Joi.string().max(100).required().messages({
    'string.base': '"food_type" debe ser un texto.',
    'string.max': '"food_type" no debe exceder {#limit} caracteres.',
    'any.required': '"food_type" es obligatorio.'
  }),

  brand: Joi.string().max(100).allow(null, '').optional().messages({
    'string.max': '"brand" no debe exceder {#limit} caracteres.'
  }),

  portion_size: Joi.number().positive().required().messages({
    'number.base': '"portion_size" debe ser un número.',
    'number.positive': '"portion_size" debe ser un número positivo.',
    'any.required': '"portion_size" es obligatorio.'
  }),

  unit: Joi.string().max(20).allow(null, '').optional().messages({
      'string.max': '"unit" no debe exceder {#limit} caracteres.'
    }),

  type_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"type_id" debe ser un número entero.'
  }),

  special_instructions: Joi.string().allow(null, '').optional().messages({
    'string.base': '"special_instructions" debe ser un texto.'
  }),

  home_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"home_id" debe ser un número entero.'
  }),

  person_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"person_id" debe ser un número entero.'
  })
});

const updatePetDietSchema = Joi.object({
  pet_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"pet_id" debe ser un número entero.'
  }),

  name: Joi.string().max(255).allow(null, '').optional().messages({
      'string.max': '"name" no debe exceder {#limit} caracteres.'
  }),

  food_type: Joi.string().max(100).allow(null, '').optional().messages({
    'string.max': '"food_type" no debe exceder {#limit} caracteres.'
  }),

  brand: Joi.string().max(100).allow(null, '').optional().messages({
    'string.max': '"brand" no debe exceder {#limit} caracteres.'
  }),

  portion_size: Joi.number().positive().allow(null, '').optional().messages({
    'number.positive': '"portion_size" debe ser un número positivo.'
  }),

  unit: Joi.string().max(20).allow(null, '').optional().messages({
      'string.max': '"unit" no debe exceder {#limit} caracteres.'
    }),

  type_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"type_id" debe ser un número entero.'
  }),

  special_instructions: Joi.string().allow(null, '').optional().messages({
    'string.base': '"special_instructions" debe ser un texto.'
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

const idPetDietSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    'any.required': '"id" es obligatorio.',
    'number.integer': '"id" debe ser un número entero.'
  })
});

const getPetDietsSchema = Joi.object({
  pet_id: Joi.number().integer().allow(null, '').optional(),
  home_id: Joi.number().integer().allow(null, '').optional(),
  person_id: Joi.number().integer().allow(null, '').optional(),
  type_id: Joi.number().integer().allow(null, '').optional(),
  food_type: Joi.string().max(50).allow(null, '').optional(),
  active: Joi.boolean().optional()
});

module.exports = {
  storePetDietSchema,
  updatePetDietSchema,
  idPetDietSchema,
  getPetDietsSchema,
};