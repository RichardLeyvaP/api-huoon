const Joi = require("joi");

const storeRecipeProductSchema = Joi.object({
  person_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": '"person_id" debe ser un número válido',
     "number.positive": '"person_id" debe ser un número positivo'
     }),
  recipe_id: Joi.number().integer().positive().required().messages({
    "number.base": '"recipe_id" debe ser un número válido',
    "any.required": '"recipe_id" es requerido'
  }),
  product_id: Joi.number().integer().positive().required().messages({
    "number.base": '"product_id" debe ser un número válido',
    "any.required": '"product_id" es requerido'
  }),
  quantity: Joi.number().precision(3).min(0.001).required().messages({
    "number.base": '"quantity" debe ser un número',
    "number.min": '"quantity" debe ser mayor a 0',
    "any.required": '"quantity" es requerido'
  }),
  unit: Joi.string().valid('g', 'ml', 'unidad', 'taza', 'cda', 'cdta', 'kg', 'L').required().messages({
    "any.only": '"unit" debe ser una unidad válida (g, ml, unidad, taza, cda, cdta, kg, L)',
    "any.required": '"unit" es requerido'
  }),
  calories_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  protein_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  carbs_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  fats_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  fiber_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  sugar_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  saturated_fats_per_unit: Joi.number().precision(2).min(0).allow(null).optional()
});

const updateRecipeProductSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es requerido'
  }),
  quantity: Joi.number().precision(3).min(0.001).optional(),
  unit: Joi.string().valid('g', 'ml', 'unidad', 'taza', 'cda', 'cdta', 'kg', 'L').optional(),
  calories_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  protein_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  carbs_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  fats_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  fiber_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  sugar_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
  saturated_fats_per_unit: Joi.number().precision(2).min(0).allow(null).optional()
});

const idRecipeProductSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es requerido'
  })
});

const getRecipeProductsByRecipeSchema = Joi.object({
  recipe_id: Joi.number().integer().positive().required().messages({
    "number.base": '"recipe_id" debe ser un número válido',
    "any.required": '"recipe_id" es requerido'
  })
});

module.exports = {
  storeRecipeProductSchema,
  updateRecipeProductSchema,
  idRecipeProductSchema,
  getRecipeProductsByRecipeSchema
};