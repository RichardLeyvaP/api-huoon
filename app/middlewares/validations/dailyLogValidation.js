const Joi = require("joi");

const storeDailyLogSchema = Joi.object({
  person_id: Joi.number().integer().positive().allow(null).optional().messages({
      "number.base": '"person_id" debe ser un número válido',
      "number.positive": '"person_id" debe ser un número positivo'
    }),
  date: Joi.date().iso().required().messages({
    "date.base": '"date" debe ser una fecha válida en formato ISO (YYYY-MM-DD)',
    "any.required": '"date" es requerido'
  }),
  water_intake: Joi.number().precision(1).min(0).max(10).allow(null).optional().messages({
    "number.base": '"water_intake" debe ser un número',
    "number.precision": '"water_intake" debe tener máximo 1 decimal',
    "number.min": '"water_intake" no puede ser negativo',
    "number.max": '"water_intake" no puede exceder 10 litros'
  }),
  sleep_hours: Joi.number().integer().min(0).max(24).allow(null).optional().messages({
    "number.base": '"sleep_hours" debe ser un número entero',
    "number.min": '"sleep_hours" no puede ser negativo',
    "number.max": '"sleep_hours" no puede exceder 24 horas'
  }),
  steps: Joi.number().integer().min(0).max(100000).allow(null).optional().messages({
    "number.base": '"steps" debe ser un número entero',
    "number.min": '"steps" no puede ser negativo',
    "number.max": '"steps" no puede exceder 100,000'
  }),
  notes: Joi.string().max(500).allow(null, "").optional().messages({
    "string.base": '"notes" debe ser texto',
    "string.max": '"notes" no debe exceder 500 caracteres'
  })
});

const updateDailyLogSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "number.positive": '"id" debe ser positivo',
    "any.required": '"id" es requerido'
  }),  
  date: Joi.date().iso().optional().messages({
    "date.base": '"date" debe ser una fecha válida en formato ISO (YYYY-MM-DD)',
    "any.required": '"date" es requerido'
  }),
  water_intake: Joi.number().precision(1).min(0).max(10).allow(null).optional().messages({
    "number.base": '"water_intake" debe ser un número',
    "number.precision": '"water_intake" debe tener máximo 1 decimal',
    "number.min": '"water_intake" no puede ser negativo',
    "number.max": '"water_intake" no puede exceder 10 litros'
  }),
  sleep_hours: Joi.number().integer().min(0).max(24).allow(null).optional().messages({
    "number.base": '"sleep_hours" debe ser un número entero',
    "number.min": '"sleep_hours" no puede ser negativo',
    "number.max": '"sleep_hours" no puede exceder 24 horas'
  }),
  steps: Joi.number().integer().min(0).max(100000).allow(null).optional().messages({
    "number.base": '"steps" debe ser un número entero',
    "number.min": '"steps" no puede ser negativo',
    "number.max": '"steps" no puede exceder 100,000'
  }),
  notes: Joi.string().max(500).allow(null, "").optional().messages({
    "string.base": '"notes" debe ser texto',
    "string.max": '"notes" no debe exceder 500 caracteres'
  })
});

const idDailyLogSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": '"id" debe ser un número válido',
    "number.positive": '"id" debe ser positivo',
    "any.required": '"id" es requerido'
  })
});

const getDailyLogByPersonAndDateSchema = Joi.object({
  person_id: Joi.number().integer().positive().required().messages({
    "number.base": '"person_id" debe ser un número válido',
    "number.positive": '"person_id" debe ser positivo',
    "any.required": '"person_id" es requerido'
  }),
  date: Joi.date().iso().required().messages({
    "date.base": '"date" debe ser una fecha válida (YYYY-MM-DD)',
    "any.required": '"date" es requerido'
  })
});

module.exports = {
  storeDailyLogSchema,
  updateDailyLogSchema,
  idDailyLogSchema,
  getDailyLogByPersonAndDateSchema
};