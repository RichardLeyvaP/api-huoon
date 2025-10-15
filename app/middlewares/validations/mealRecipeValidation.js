const Joi = require("joi");

const storeMealRecipeSchema = Joi.object({
  meal_entry_id: Joi.number().integer().positive().required().messages({
    "number.base": '"meal_entry_id" debe ser un número válido',
    "any.required": '"meal_entry_id" es requerido'
  }),
  recipe_id: Joi.number().integer().positive().required().messages({
    "number.base": '"recipe_id" debe ser un número válido',
    "any.required": '"recipe_id" es requerido'
  }),
  servings: Joi.number().precision(2).min(0.01).max(10).required().messages({
    "number.base": '"servings" debe ser un número',
    "number.min": '"servings" debe ser al menos 0.01',
    "number.max": '"servings" no puede exceder 10',
    "any.required": '"servings" es requerido'
  })
});

const updateMealRecipeSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es requerido'
  }),
  servings: Joi.number().precision(2).min(0.01).max(10).optional()
});

const idMealRecipeSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es requerido'
  })
});

const getMealRecipesByMealEntrySchema = Joi.object({
  meal_entry_id: Joi.number().integer().positive().required().messages({
    "number.base": '"meal_entry_id" debe ser un número válido',
    "any.required": '"meal_entry_id" es requerido'
  })
});

module.exports = {
  storeMealRecipeSchema,
  updateMealRecipeSchema,
  idMealRecipeSchema,
  getMealRecipesByMealEntrySchema
};