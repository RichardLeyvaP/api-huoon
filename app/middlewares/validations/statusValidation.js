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

module.exports = {
    storeStatusSchema,
    updateStatusSchema,
    idStatusSchema,
};
