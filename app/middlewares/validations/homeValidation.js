const Joi = require('joi');

const storeHomeSchema = Joi.object({
    name: Joi.string().max(255).required(),
    address: Joi.string().allow(null).empty('').optional(),
    home_type_id: Joi.number().integer().required(),
    residents: Joi.number().integer().default(1).allow(null).empty('').optional(),
    geo_location: Joi.string().allow(null).empty('').optional(),
    timezone: Joi.string().allow(null).empty('').optional(),
    status_id: Joi.number().integer().required(),
    image: Joi.string()
        .pattern(/\.(jpg|jpeg|png|gif)$/i)  // Validar formato de imagen
        .allow(null).empty('').optional()                         // Hace que sea opcional
        .custom((value, helpers) => {
            const maxSize = 500 * 1024;     // 500 KB en bytes
            if (value && value.length > maxSize) {
                return helpers.message('El campo image debe ser una imagen válida de máximo 500 KB');
            }
            return value;
        })
        .messages({
            'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif)',
        }),
});

const updateHomeSchema = Joi.object({
    name: Joi.string().max(255).allow(null).empty('').optional(),
    address: Joi.string().allow(null).empty('').optional(),
    home_type_id: Joi.number().integer().allow(null).empty('').optional(),
    residents: Joi.number().integer().default(1).allow(null).empty('').optional(),
    geo_location: Joi.string().allow(null).empty('').optional(),
    timezone: Joi.string().allow(null).empty('').optional(),
    status_id: Joi.number().integer().allow(null).empty('').optional(),
    image: Joi.string()
        .pattern(/\.(jpg|jpeg|png|gif)$/i)  // Validar formato de imagen
        .allow(null).empty('').optional()                         // Hace que sea opcional
        .custom((value, helpers) => {
            const maxSize = 500 * 1024;     // 500 KB en bytes
            if (value && value.length > maxSize) {
                return helpers.message('El campo image debe ser una imagen válida de máximo 500 KB');
            }
            return value;
        })
        .messages({
            'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif)',
        }),
    id: Joi.number().required(),
});

const idHomeSchema = Joi.object({
    id: Joi.number().required()
});

module.exports = {
    storeHomeSchema,
    updateHomeSchema,
    idHomeSchema,
};
