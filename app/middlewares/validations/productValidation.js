const Joi = require('joi');

const storeProductSchema = Joi.object({
    name: Joi.string().max(255).required(),
    category_id: Joi.number().integer().required(),
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

const updateProductSchema = Joi.object({
    name: Joi.string().max(255).allow(null).empty('').optional(),
    category_id: Joi.number().integer().allow(null).empty('').optional(),
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

const idProductSchema = Joi.object({
    id: Joi.number().required()
});

module.exports = {
    storeProductSchema,
    updateProductSchema,
    idProductSchema,
};
