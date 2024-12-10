const Joi = require('joi');

const storeWareHouseSchema = Joi.object({
    title: Joi.string().max(255).required(),
    description: Joi.string().allow(null).empty('').optional(),
    location: Joi.string().allow(null).empty('').optional(),
    status: Joi.number().integer().valid(0, 1).default(0).allow(null).empty('').optional(),
});

const updateWareHouseSchema = Joi.object({
    title: Joi.string().max(255).allow(null).empty('').optional(),
    description: Joi.string().allow(null).empty('').optional(),
    location: Joi.string().allow(null).empty('').optional(),
    status: Joi.number().allow(null).empty('').optional(),
    id: Joi.number().required(),
});

const idWareHouseSchema = Joi.object({
    id: Joi.number().required()
});

module.exports = {
    storeWareHouseSchema,
    updateWareHouseSchema,
    idWareHouseSchema,
};
