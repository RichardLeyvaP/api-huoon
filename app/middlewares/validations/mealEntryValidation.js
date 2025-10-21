const Joi = require("joi");

const storeMealEntrySchema = Joi.object({
  person_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": '"person_id" debe ser un número válido',
    "number.positive": '"person_id" debe ser un número positivo'
  }),
  daily_log_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": '"daily_log_id" debe ser un número válido',
    "number.positive": '"daily_log_id" debe ser un número positivo'
  }),
  // date es opcional (el backend puede usar el día actual si no se envía)
  date: Joi.date().iso().allow(null).optional().messages({
    "date.base": '"date" debe ser una fecha válida en formato ISO (YYYY-MM-DD)'
  }),
  type_id: Joi.number().integer().positive().required().messages({
    "number.base": '"type_id" debe ser un número válido',
    "any.required": '"type_id" es requerido',
    "number.positive": '"type_id" debe ser un número positivo'
  }),
  notes: Joi.string().max(500).allow(null, "").optional().messages({
    "string.max": '"notes" no debe exceder 500 caracteres'
  }),
  // ✅ mealRecipes: array opcional de recetas
  meal_recipes: Joi.array().items(
    Joi.object({
      recipe_id: Joi.number().integer().positive().required().messages({
        "number.base": '"recipe_id" debe ser un número válido',
        "any.required": '"recipe_id" es requerido',
        "number.positive": '"recipe_id" debe ser un número positivo'
      }),
      servings: Joi.number().precision(2).min(0.1).required().messages({
        "number.base": '"servings" debe ser un número',
        "number.min": '"servings" debe ser al menos 0.1',
        "any.required": '"servings" es requerido'
      })
    })
  ).optional()
});

const updateMealEntrySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es requerido',
  }),
  person_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": '"person_id" debe ser un número válido',
    "number.positive": '"person_id" debe ser un número positivo'
  }),
  // date es opcional (el backend puede usar el día actual si no se envía)
  date: Joi.date().iso().allow(null).optional().messages({
    "date.base": '"date" debe ser una fecha válida en formato ISO (YYYY-MM-DD)'
  }),
  type_id: Joi.number().integer().positive().optional().messages({
    "number.base": '"type_id" debe ser un número válido',
    "any.required": '"type_id" es requerido',
    "number.positive": '"type_id" debe ser un número positivo'
  }),
  notes: Joi.string().max(500).allow(null, "").optional().messages({
    "string.max": '"notes" no debe exceder 500 caracteres'
  }),
  // ✅ mealRecipes: array opcional de recetas
  meal_recipes: Joi.array().items(
    Joi.object({
      recipe_id: Joi.number().integer().positive().required().messages({
        "number.base": '"recipe_id" debe ser un número válido',
        "any.required": '"recipe_id" es requerido',
        "number.positive": '"recipe_id" debe ser un número positivo'
      }),
      servings: Joi.number().precision(2).min(0.1).required().messages({
        "number.base": '"servings" debe ser un número',
        "number.min": '"servings" debe ser al menos 0.1',
        "any.required": '"servings" es requerido'
      })
    })
  ).optional()
});

const idMealEntrySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es requerido',
  }),
});

const getMealEntriesByDailyLogSchema = Joi.object({
  daily_log_id: Joi.number().integer().positive().optional().messages({
    "number.base": '"daily_log_id" debe ser un número válido',
  }),
  person_id: Joi.number().integer().positive().optional().messages({
    "number.base": '"person_id" debe ser un número válido',
  }),
});

module.exports = {
  storeMealEntrySchema,
  updateMealEntrySchema,
  idMealEntrySchema,
  getMealEntriesByDailyLogSchema,
};
