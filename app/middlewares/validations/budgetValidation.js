const Joi = require("joi");

// Esquema para crear un nuevo presupuesto
const storeBudgetSchema = Joi.object({
   person_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID de la persona debe ser un número",
  }),
  home_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del hogar debe ser un número",
  }),
  category_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID de la categoría debe ser un número",
  }),
   type_id: Joi.number().integer().allow(null).optional().messages({
      "number.base": "El ID de la frecuencia debe ser un número",
    }),
  amount: Joi.number().precision(2).allow(null).empty('').optional().positive().messages({
    "number.base": "El monto debe ser un número",
    "number.positive": "El monto debe ser positivo",
  }),
  used_amount: Joi.number().precision(2).min(0).default(0).messages({
    "number.base": "El monto utilizado debe ser un número",
    "number.min": "El monto utilizado no puede ser negativo",
  }),
  start_date: Joi.date().allow(null, "").optional().empty("").default(null).messages({
    "date.base": "La fecha de fin debe ser una fecha válida",
  }),
  end_date: Joi.date().allow(null, "").optional().empty("").default(null).messages({
    "date.base": "La fecha de fin debe ser una fecha válida",
  }),
  budget_type: Joi.string().max(50).allow(null).empty('').optional().messages({
    "string.base": "El tipo de presupuesto debe ser texto",
  }),
  status: Joi.string().max(50).allow(null).empty('').optional().messages({
    "string.base": "El estado debe ser texto",
  }),
  description: Joi.string().allow(null, "").optional().empty("").default(null).messages({
    "string.base": "La descripción debe ser texto",
  }),
  currency: Joi.string().max(50).allow(null).empty('').optional().messages({
    "string.base": "La moneda debe ser texto",
  })
}); // Asegura que solo uno de los dos esté presente

// Esquema para actualizar un presupuesto
const updateBudgetSchema = Joi.object({
   person_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID de la persona debe ser un número",
  }),
  home_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID del hogar debe ser un número",
  }),
  category_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "number.base": "El ID de la categoría debe ser un número",
  }),
  type_id: Joi.number().integer().allow(null).optional().messages({
      "number.base": "El ID de la frecuencia debe ser un número",
    }),
  amount: Joi.number().precision(2).allow(null).empty('').optional().positive().messages({
    "number.base": "El monto debe ser un número",
    "number.positive": "El monto debe ser positivo",
  }),
  used_amount: Joi.number().precision(2).min(0).default(0).messages({
    "number.base": "El monto utilizado debe ser un número",
    "number.min": "El monto utilizado no puede ser negativo",
  }),
  start_date: Joi.date().allow(null, "").optional().empty("").default(null).messages({
    "date.base": "La fecha de fin debe ser una fecha válida",
  }),
  end_date: Joi.date().allow(null, "").optional().empty("").default(null).messages({
    "date.base": "La fecha de fin debe ser una fecha válida",
  }),
  budget_type: Joi.string().max(50).allow(null).empty('').optional().messages({
    "string.base": "El tipo de presupuesto debe ser texto",
  }),
  status: Joi.string().max(50).allow(null).empty('').optional().messages({
    "string.base": "El estado debe ser texto",
  }),
  description: Joi.string().allow(null, "").optional().empty("").default(null).messages({
    "string.base": "La descripción debe ser texto",
  }),
  currency: Joi.string().max(50).allow(null).empty('').optional().messages({
    "string.base": "La moneda debe ser texto",
  }),
  id: Joi.number().integer().required().messages({
    "number.base": "El ID del presupuesto debe ser un número",
    "any.required": "El ID del presupuesto es requerido",
  })
}); // Asegura que solo uno de los dos esté presente

// Esquema para validar el ID de un presupuesto
const idBudgetSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});

// Esquema para obtener presupuestos por persona o hogar
const getBudgetsSchema = Joi.object({
  person_id: Joi.number().integer().optional().messages({
    "number.base": "El ID de la persona debe ser un número",
  }),
  home_id: Joi.number().integer().optional().messages({
    "number.base": "El ID del hogar debe ser un número",
  }),
  period: Joi.string().valid('day', 'week', 'month', 'year', 'custom').optional().messages({
    "string.base": "El período debe ser texto",
    "any.only": "El período debe ser: day, week, month, year o custom",
  }),
  start_date: Joi.date().optional().allow(null).messages({
          "date.base": "La fecha de inicio debe ser una fecha válida",
        }),
  end_date: Joi.date().optional().allow(null).messages({
          "date.base": "La fecha de inicio debe ser una fecha válida",
        }),
}); // Asegura que solo uno de los dos esté presente

module.exports = {
  storeBudgetSchema,
  updateBudgetSchema,
  idBudgetSchema,
  getBudgetsSchema,
};