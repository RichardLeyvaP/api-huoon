const Joi = require("joi");

const storeRecipeSchema = Joi.object({
  person_id: Joi.number().integer().positive().allow(null).optional().messages({
      "number.base": '"person_id" debe ser un número válido',
      "number.positive": '"person_id" debe ser un número positivo'
    }),
  home_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": '"home_id" debe ser un número válido'
  }),
  name: Joi.string().min(1).required().messages({
    "string.base": '"name" debe ser texto',
    "string.min": '"name" no puede estar vacío',
    "string.max": '"name" no debe exceder 100 caracteres',
    "any.required": '"name" es requerido'
  }),
  description: Joi.string().allow(null, "").optional().messages({
    "string.max": '"description" no debe exceder 1000 caracteres'
  }),
  is_favorite: Joi.boolean().optional().messages({
    "boolean.base": '"is_favorite" debe ser true o false'
  }),
  image: Joi.string()
        .pattern(/\.(jpg|jpeg|png|gif)$/i)  // Validar formato de imagen
        .allow(null).empty('').optional()                         // Hace que sea opcional
        .custom((value, helpers) => {
            const maxSize = 500 * 1024;     // 500 KB en bytes
            if (value && value.length > maxSize) {
                return helpers.message('El campo image debe ser una imagen válida de máximo 500 KB');
            }
            return value;
        })
        .messages({
            'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif)',
        }),
  preparation_time: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": '"preparation_time" debe ser un número entero (minutos)',
    "number.min": '"preparation_time" no puede ser negativo',
    "number.max": '"preparation_time" no puede exceder 1440 minutos (24h)'
  }),
  servings: Joi.number().integer().min(1).optional().messages({
    "number.base": '"servings" debe ser un número entero',
    "number.min": '"servings" debe ser al menos 1',
    "number.max": '"servings" no puede exceder 100',
    "any.required": '"servings" es requerido'
  }),
  calories: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": '"calories" debe ser un número entero',
    "number.min": '"calories" no puede ser negativo'
  }),
  protein: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": '"protein" debe ser un número entero (gramos)'
  }),
  carbs: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": '"carbs" debe ser un número entero (gramos)'
  }),
  fats: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": '"fats" debe ser un número entero (gramos)'
  }),
  fiber: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": '"fiber" debe ser un número entero (gramos)'
  }),
  sugar: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": '"sugar" debe ser un número entero (gramos)'
  }),
  saturated_fats: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": '"saturated_fats" debe ser un número entero (gramos)'
  }),
  is_private: Joi.boolean().optional().messages({
    "boolean.base": '"is_private" debe ser true o false'
  }),
  products: Joi.array().items(
  Joi.object({
    product_id: Joi.number().integer().positive().required().messages({
      "number.base": '"product_id" debe ser un número válido',
      "any.required": '"product_id" es requerido'
    }),
     person_id: Joi.number().integer().positive().allow(null).optional().messages({
      "number.base": '"person_id" debe ser un número válido',
      "number.positive": '"person_id" debe ser un número positivo'
    }),
    quantity: Joi.number().precision(3).min(0.001).required().messages({
      "number.base": '"quantity" debe ser un número',
      "number.min": '"quantity" debe ser mayor a 0',
      "any.required": '"quantity" es requerido'
    }),
    unit: Joi.string().valid('g', 'ml', 'unidad', 'taza', 'cda', 'cdta', 'kg', 'L').required().messages({
      "any.only": '"unit" debe ser una unidad válida',
      "any.required": '"unit" es requerido'
    }),
    calories_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    protein_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    carbs_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    fats_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    fiber_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    sugar_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    saturated_fats_per_unit: Joi.number().precision(2).min(0).allow(null).optional()
  })
).optional()
});

const updateRecipeSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es requerido'
  }),
  home_id: Joi.number().integer().positive().allow(null).optional(),
  name: Joi.string().min(1).optional(),
  description: Joi.string().allow(null, "").optional(),
  is_favorite: Joi.boolean().optional(),
  image: Joi.string()
        .pattern(/\.(jpg|jpeg|png|gif)$/i)  // Validar formato de imagen
        .allow(null).empty('').optional()                         // Hace que sea opcional
        .custom((value, helpers) => {
            const maxSize = 500 * 1024;     // 500 KB en bytes
            if (value && value.length > maxSize) {
                return helpers.message('El campo image debe ser una imagen válida de máximo 500 KB');
            }
            return value;
        })
        .messages({
            'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif)',
        }),
  preparation_time: Joi.number().integer().min(0).allow(null).optional(),
  servings: Joi.number().integer().min(1).optional(),
  calories: Joi.number().integer().min(0).allow(null).optional(),
  protein: Joi.number().integer().min(0).allow(null).optional(),
  carbs: Joi.number().integer().min(0).allow(null).optional(),
  fats: Joi.number().integer().min(0).allow(null).optional(),
  fiber: Joi.number().integer().min(0).allow(null).optional(),
  sugar: Joi.number().integer().min(0).allow(null).optional(),
  saturated_fats: Joi.number().integer().min(0).allow(null).optional(),
  is_private: Joi.boolean().optional(),
  products: Joi.array().items(
  Joi.object({
    product_id: Joi.number().integer().positive().allow(null).optional().messages({
      "number.base": '"product_id" debe ser un número válido',
      "any.required": '"product_id" es requerido'
    }),
    person_id: Joi.number().integer().positive().allow(null).optional().messages({
      "number.base": '"person_id" debe ser un número válido',
      "number.positive": '"person_id" debe ser un número positivo'
    }),
    quantity: Joi.number().precision(3).min(0.001).allow(null).optional().messages({
      "number.base": '"quantity" debe ser un número',
      "number.min": '"quantity" debe ser mayor a 0',
      "any.required": '"quantity" es requerido'
    }),
    unit: Joi.string().valid('g', 'ml', 'unidad', 'taza', 'cda', 'cdta', 'kg', 'L').required().messages({
      "any.only": '"unit" debe ser una unidad válida',
      "any.required": '"unit" es requerido'
    }),
    calories_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    protein_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    carbs_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    fats_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    fiber_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    sugar_per_unit: Joi.number().precision(2).min(0).allow(null).optional(),
    saturated_fats_per_unit: Joi.number().precision(2).min(0).allow(null).optional()
  })
).optional()
});

const idRecipeSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es requerido'
  })
});

const getRecipesByPersonSchema = Joi.object({
  person_id: Joi.number().integer().positive().required().messages({
    "number.base": '"person_id" debe ser un número válido',
    "any.required": '"person_id" es requerido'
  })
});

module.exports = {
  storeRecipeSchema,
  updateRecipeSchema,
  idRecipeSchema,
  getRecipesByPersonSchema
};