const Joi = require('joi');

const storePrioritySchema = Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().allow(null).empty('').optional(),
    level: Joi.number().integer().allow(null).empty('').optional(),
    color: Joi.string().allow(null).empty('').optional(),
});

const updatePrioritySchema = Joi.object({
    name: Joi.string().max(255).allow(null).empty('').optional(),
    description: Joi.string().allow(null).empty('').optional(),
    level: Joi.number().integer().allow(null).empty('').optional(),
    color: Joi.string().allow(null).empty('').optional(),
    id: Joi.number().required(),
});

const idPrioritySchema = Joi.object({
    id: Joi.number().required()
});

module.exports = {
    storePrioritySchema,
    updatePrioritySchema,
    idPrioritySchema,
};
