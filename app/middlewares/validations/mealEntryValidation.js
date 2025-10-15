const Joi = require("joi");

const storeMealEntrySchema = Joi.object({
  daily_log_id: Joi.number().integer().positive().required().messages({
    "number.base": '"daily_log_id" debe ser un número válido',
    "any.required": '"daily_log_id" es requerido'
  }),
  type_id: Joi.number().integer().positive().required().messages({
    "number.base": '"type_id" debe ser un número válido',
    "any.required": '"type_id" es requerido'
  }),
  notes: Joi.string().max(500).allow(null, "").optional().messages({
    "string.max": '"notes" no debe exceder 500 caracteres'
  })
});

const updateMealEntrySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es requerido'
  }),
  notes: Joi.string().max(500).allow(null, "").optional()
});

const idMealEntrySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "any.required": '"id" es requerido'
  })
});

const getMealEntriesByDailyLogSchema = Joi.object({
  daily_log_id: Joi.number().integer().positive().required().messages({
    "number.base": '"daily_log_id" debe ser un número válido',
    "any.required": '"daily_log_id" es requerido'
  })
});

module.exports = {
  storeMealEntrySchema,
  updateMealEntrySchema,
  idMealEntrySchema,
  getMealEntriesByDailyLogSchema
};