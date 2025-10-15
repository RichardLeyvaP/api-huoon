const Joi = require("joi");

// Schema for creating a new nutrition profile
const storeNutritionProfileSchema = Joi.object({
  person_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": '"person_id" debe ser un número válido',
    "number.positive": '"person_id" debe ser un número positivo'
  }),
  calories: Joi.number().integer().min(0).max(10000).allow(null).optional().messages({
    "number.base": '"calories" debe ser un número entero',
    "number.min": '"calories" no puede ser negativo',
    "number.max": '"calories" no puede exceder 10,000'
  }),
  protein: Joi.number().integer().min(0).max(500).allow(null).optional().messages({
    "number.base": '"protein" debe ser un número entero (gramos)',
    "number.min": '"protein" no puede ser negativo',
    "number.max": '"protein" no puede exceder 500g'
  }),
  carbs: Joi.number().integer().min(0).max(1000).allow(null).optional().messages({
    "number.base": '"carbs" debe ser un número entero (gramos)',
    "number.min": '"carbs" no puede ser negativo',
    "number.max": '"carbs" no puede exceder 1000g'
  }),
  fats: Joi.number().integer().min(0).max(500).allow(null).optional().messages({
    "number.base": '"fats" debe ser un número entero (gramos)',
    "number.min": '"fats" no puede ser negativo',
    "number.max": '"fats" no puede exceder 500g'
  }),
  fiber: Joi.number().integer().min(0).max(100).allow(null).optional().messages({
    "number.base": '"fiber" debe ser un número entero (gramos)',
    "number.min": '"fiber" no puede ser negativo',
    "number.max": '"fiber" no puede exceder 100g'
  }),
  sugar_limit: Joi.number().integer().min(0).max(200).allow(null).optional().messages({
    "number.base": '"sugar_limit" debe ser un número entero (gramos)',
    "number.min": '"sugar_limit" no puede ser negativo',
    "number.max": '"sugar_limit" no puede exceder 200g'
  }),
  sat_fats_limit: Joi.number().integer().min(0).max(200).allow(null).optional().messages({
    "number.base": '"sat_fats_limit" debe ser un número entero (gramos)',
    "number.min": '"sat_fats_limit" no puede ser negativo',
    "number.max": '"sat_fats_limit" no puede exceder 200g'
  }),
  water: Joi.number().precision(1).min(0).max(10).allow(null).optional().messages({
    "number.base": '"water" debe ser un número (litros)',
    "number.min": '"water" no puede ser negativo',
    "number.max": '"water" no puede exceder 10 litros',
    "number.precision": '"water" debe tener máximo 1 decimal (ej: 2.0)'
  })
});

// Schema for updating a nutrition profile
const updateNutritionProfileSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "number.positive": '"id" debe ser un número positivo',
    "any.required": '"id" del perfil nutricional es requerido'
  }),
  calories: Joi.number().integer().min(0).max(10000).allow(null).optional().messages({
    "number.base": '"calories" debe ser un número entero',
    "number.min": '"calories" no puede ser negativo',
    "number.max": '"calories" no puede exceder 10,000'
  }),
  protein: Joi.number().integer().min(0).max(500).allow(null).optional().messages({
    "number.base": '"protein" debe ser un número entero (gramos)',
    "number.min": '"protein" no puede ser negativo',
    "number.max": '"protein" no puede exceder 500g'
  }),
  carbs: Joi.number().integer().min(0).max(1000).allow(null).optional().messages({
    "number.base": '"carbs" debe ser un número entero (gramos)',
    "number.min": '"carbs" no puede ser negativo',
    "number.max": '"carbs" no puede exceder 1000g'
  }),
  fats: Joi.number().integer().min(0).max(500).allow(null).optional().messages({
    "number.base": '"fats" debe ser un número entero (gramos)',
    "number.min": '"fats" no puede ser negativo',
    "number.max": '"fats" no puede exceder 500g'
  }),
  fiber: Joi.number().integer().min(0).max(100).allow(null).optional().messages({
    "number.base": '"fiber" debe ser un número entero (gramos)',
    "number.min": '"fiber" no puede ser negativo',
    "number.max": '"fiber" no puede exceder 100g'
  }),
  sugar_limit: Joi.number().integer().min(0).max(200).allow(null).optional().messages({
    "number.base": '"sugar_limit" debe ser un número entero (gramos)',
    "number.min": '"sugar_limit" no puede ser negativo',
    "number.max": '"sugar_limit" no puede exceder 200g'
  }),
  sat_fats_limit: Joi.number().integer().min(0).max(200).allow(null).optional().messages({
    "number.base": '"sat_fats_limit" debe ser un número entero (gramos)',
    "number.min": '"sat_fats_limit" no puede ser negativo',
    "number.max": '"sat_fats_limit" no puede exceder 200g'
  }),
  water: Joi.number().precision(1).min(0).max(10).allow(null).optional().messages({
    "number.base": '"water" debe ser un número (litros)',
    "number.min": '"water" no puede ser negativo',
    "number.max": '"water" no puede exceder 10 litros',
    "number.precision": '"water" debe tener máximo 1 decimal (ej: 2.0)'
  })
});

// Schema for validating a nutrition profile ID
const idNutritionProfileSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "number.positive": '"id" debe ser un número positivo',
    "any.required": '"id" es requerido'
  })
});

// Schema for validating person_id to fetch nutrition profile
const getNutritionProfileByPersonSchema = Joi.object({
  person_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": '"person_id" debe ser un número válido',
    "number.positive": '"person_id" debe ser un número positivo',
    "any.required": '"person_id" es requerido'
  })
});

module.exports = {
  storeNutritionProfileSchema,
  updateNutritionProfileSchema,
  idNutritionProfileSchema,
  getNutritionProfileByPersonSchema
};