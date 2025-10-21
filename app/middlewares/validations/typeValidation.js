const Joi = require('joi');

// Esquema para crear un nuevo tipo
const storeTypeSchema = Joi.object({
    name: Joi.string().max(255).required(), // Nombre es obligatorio
    description: Joi.string().allow(null).empty('').optional(), // Descripción es opcional
    type: Joi.string().required(), // Tipo debe ser "Salud" o "Tarea"
});

// Esquema para actualizar un tipo existente
const updateTypeSchema = Joi.object({
    name: Joi.string().max(255).optional(), // Nombre es opcional
    description: Joi.string().allow(null).empty('').optional(), // Descripción es opcional
    type: Joi.string().optional(), // Tipo es opcional pero debe ser "Salud" o "Tarea"
    id: Joi.number().required(), // ID es obligatorio para actualizar
});

// Esquema para validar un ID
const idTypeSchema = Joi.object({
    id: Joi.number().required(), // ID es obligatorio
});

const typeSchema = Joi.object({
    type: Joi.string().required(),
    query: Joi.string().allow(null).empty('').optional(),
    person_id: Joi.number().integer().positive().allow(null).optional().messages({
        "number.base": '"person_id" debe ser un número válido',
        "number.positive": '"person_id" debe ser un número positivo',
        "any.required": '"person_id" es requerido'
      }),
});

module.exports = {
    storeTypeSchema,
    updateTypeSchema,
    idTypeSchema,
    typeSchema
};