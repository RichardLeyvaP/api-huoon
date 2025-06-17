const Joi = require('joi');

const storeStatusSchema = Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().allow(null).empty('').optional(),
    icon: Joi.string().allow(null).empty('').optional(),
    color: Joi.string().allow(null).empty('').optional(),
    type: Joi.string().allow(null).empty('').optional()
});

const updateStatusSchema = Joi.object({
    name: Joi.string().max(255).allow(null).empty('').optional(),
    description: Joi.string().allow(null).empty('').optional(),
    icon: Joi.string().allow(null).empty('').optional(),
    color: Joi.string().allow(null).empty('').optional(),
    type: Joi.string().allow(null).empty('').optional(),
    id: Joi.number().required(),
});

const idStatusSchema = Joi.object({
    id: Joi.number().required()
});

const typeStatusSchema = Joi.object({
  type: Joi.string()
    .required()
    .messages({
      'any.required': 'El tipo es requerido',
      'string.empty': 'El tipo no puede estar vacío',
    }),
    home_id: Joi.number().integer().allow(null).empty('').optional(),
});

module.exports = {
    storeStatusSchema,
    updateStatusSchema,
    idStatusSchema,
    typeStatusSchema
};
