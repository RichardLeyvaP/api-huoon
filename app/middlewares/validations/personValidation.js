const Joi = require('joi');

const storePersonSchema = Joi.object({
    user_id: Joi.number().allow(null).empty('').optional(), // user_id es obligatorio
    name: Joi.string().required(),    // name es obligatorio
    user: Joi.string().allow(null).empty('').optional(), // nullable
    password: Joi.string().allow(null).empty('').optional(), // nullable
    language: Joi.string().allow(null).empty('').optional(), // nullable
    birth_date: Joi.date().allow(null).empty('').optional(), // nullable
    age: Joi.number().integer().min(0).allow(null).empty('').optional(), // nullable
    gender: Joi.string().max(10).allow(null).empty('').optional(), // nullable
    email: Joi.string().email().allow(null).empty('').optional(), // nullable
    phone: Joi.string().max(15).allow(null).empty('').optional(), // nullable
    address: Joi.string().max(255).allow(null).empty('').optional(), // nullable
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

const updatePersonSchema = Joi.object({
    user_id: Joi.number().allow(null).empty('').optional(), // user_id es obligatorio
    name: Joi.string().allow(null).empty('').optional(),
    user: Joi.string().allow(null).empty('').optional(), // nullable
    password: Joi.string().allow(null).empty('').optional(), // nullable
    language: Joi.string().allow(null).empty('').optional(), // nullable
    birth_date: Joi.date().allow(null).empty('').optional(), // nullable
    age: Joi.number().integer().min(0).allow(null).empty('').optional(), // nullable
    gender: Joi.string().max(10).allow(null).empty('').optional(), // nullable
    email: Joi.string().email().allow(null).empty('').optional(), // nullable
    phone: Joi.string().max(15).allow(null).empty('').optional(), // nullable
    address: Joi.string().max(255).allow(null).empty('').optional(), // nullable
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

const idPersonSchema = Joi.object({
    id: Joi.number().required()
});

module.exports = {
    storePersonSchema,
    updatePersonSchema,
    idPersonSchema,
};
