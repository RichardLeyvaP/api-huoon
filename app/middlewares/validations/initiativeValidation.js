const Joi = require("joi");

// Esquema para crear una iniciativa
const storeInitiativeSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    "string.empty": "El título es obligatorio",
    "string.max": "El título no debe exceder los 255 caracteres",
    "any.required": "El título es obligatorio"
  }),
  description: Joi.string().allow(null, "").optional().empty("").default(null),
  type: Joi.string().allow(null, "").optional().empty(null),
  task_type: Joi.string().allow(null, "").optional().empty(null),
  priority_id: Joi.number().integer().positive().allow(null).optional(),
  status: Joi.string().allow(null, "").optional().empty("").default(null),
  person_id: Joi.number().integer().positive().optional(),
  parent_id: Joi.number().integer().positive().allow(null).optional(),
  recurrence: Joi.string().allow(null, "").optional().empty(null)
});

// Esquema para actualizar una iniciativa
const updateInitiativeSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "El ID debe ser un número entero",
    "any.required": "El ID de la iniciativa es obligatorio"
  }),
  title: Joi.string().max(255).optional().messages({
    "string.max": "El título no debe exceder los 255 caracteres"
  }),
  description: Joi.string().allow(null, "").optional().empty("").default(null),
  type: Joi.string().allow(null, "").optional().empty(null),
  task_type: Joi.string().allow(null, "").optional().empty(null),
  priority_id: Joi.number().integer().positive().allow(null).optional(),
  status: Joi.string().allow(null, "").optional().empty("").default(null),
  person_id: Joi.number().integer().positive().optional(),
  parent_id: Joi.number().integer().positive().allow(null).optional(),
  recurrence: Joi.string().allow(null, "").optional().empty(null)
});

// Esquema para obtener por ID (usado en show y destroy)
const idInitiativeSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "El ID debe ser un número entero",
    "any.required": "El ID es obligatorio"
  })
});

// Esquema para obtener iniciativas por person_id (opcional en cuerpo o implícito)
const personStatusInitiativeSchema = Joi.object({
  person_id: Joi.number().integer().positive().optional(),
  status: Joi.string().allow(null, "").optional().empty("").default(null),
  task_type: Joi.string().allow(null, "").optional().empty("").default(null),
});

module.exports = {
  storeInitiativeSchema,
  updateInitiativeSchema,
  idInitiativeSchema,
  personStatusInitiativeSchema
};