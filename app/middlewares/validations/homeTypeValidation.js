const Joi = require('joi');

const storeHomeTypeSchema = Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().allow(null).empty('').optional(),
    icon: Joi.string().allow(null).empty('').optional(),
});

const updateHomeTypeSchema = Joi.object({
    name: Joi.string().max(255).optional(),
    description: Joi.string().allow(null).empty('').optional(),
    icon: Joi.string().allow(null).empty('').optional(),
    id: Joi.number().required(),
});

const idHomeTypeSchema = Joi.object({
    id: Joi.number().required()
});

module.exports = {
    storeHomeTypeSchema,
    updateHomeTypeSchema,
    idHomeTypeSchema,
};
