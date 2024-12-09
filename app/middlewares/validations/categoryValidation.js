const Joi = require('joi');

const storeCategorySchema = Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().allow(null, '').optional(),
    color: Joi.string().allow(null, '').optional(),
    type: Joi.string().allow(null, '').optional(), // Asegúrate de que este campo esté permitido
    icon: Joi.alternatives().try(
        Joi.string(),
        Joi.object({
            mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/jpg', 'image/gif').required(),
            size: Joi.number().max(2048 * 1024).required()
        })
    ).allow(null, '').optional(),
    parent_id: Joi.number().integer().allow(null, '').optional(),
});

const updateCategorySchema = Joi.object({
    name: Joi.string().max(255).allow(null, '').optional(),
    description: Joi.string().allow(null, '').optional(),
    color: Joi.string().allow(null, '').optional(),
    type: Joi.string().allow(null, '').optional(), // Asegúrate de que este campo esté permitido
    icon: Joi.alternatives().try(
        Joi.string(),
        Joi.object({
            mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/jpg', 'image/gif').required(),
            size: Joi.number().max(2048 * 1024).required()
        })
    ).allow(null, '').optional(),
    parent_id: Joi.number().integer().allow(null, '').optional(),
    id: Joi.number().required(),
});

const idCategorySchema = Joi.object({
    id: Joi.number().required()
});

module.exports = {
    storeCategorySchema,
    updateCategorySchema,
    idCategorySchema,
};
