const Joi = require('joi');

const storeFinanceSchema = Joi.object({
    home_id: Joi.number().integer().required().messages({
        'number.base': '"home_id" debe ser un número',
        'number.integer': '"home_id" debe ser un número entero',
        'any.required': '"home_id" es un campo obligatorio',
    }),
    spent: Joi.number().precision(2).allow(null).empty('').optional().custom((value, helpers) => {
        return value === "" ? null : value;
    }).messages({
        'number.base': '"spent" debe ser un número',
        'number.precision': '"spent" debe tener como máximo 2 decimales',
    }),
    income: Joi.number().precision(2).allow(null).empty('').optional().custom((value, helpers) => {
        return value === "" ? null : value;
    }).messages({
        'number.base': '"income" debe ser un número',
        'number.precision': '"income" debe tener como máximo 2 decimales',
    }),
    date: Joi.date().required().messages({
        'date.base': '"date" debe ser una fecha válida',
        'any.required': '"date" es un campo obligatorio',
    }),
    description: Joi.string().max(255).allow(null).empty('').optional().messages({
        'string.base': '"description" debe ser una cadena de texto',
        'string.max': '"description" no debe exceder los 255 caracteres',
    }),
    type: Joi.string().max(50).allow(null).empty('').optional().messages({
        'string.base': '"type" debe ser una cadena de texto',
        'string.max': '"type" no debe exceder los 50 caracteres',
    }),
    method: Joi.string().max(50).allow(null).empty('').optional().messages({
        'string.base': '"method" debe ser una cadena de texto',
        'string.max': '"method" no debe exceder los 50 caracteres',
    }),
    image: Joi.string()
        .pattern(/\.(jpg|jpeg|png|gif)$/i)
        .allow(null).empty('').optional()
        .custom((value, helpers) => {
            const maxSize = 500 * 1024; // 500 KB en bytes
            if (value && value.length > maxSize) {
                return helpers.message('El campo image debe ser una imagen válida de máximo 500 KB');
            }
            return value;
        })
        .messages({
            'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif)',
        }),
});

const updateFinanceSchema = Joi.object({
    home_id: Joi.number().integer().allow(null).empty('').optional(),
    spent: Joi.number().precision(2).allow(null).empty('').optional().custom((value, helpers) => {
        return value === "" ? null : value;
    }),
    income: Joi.number().precision(2).allow(null).empty('').optional().custom((value, helpers) => {
        return value === "" ? null : value;
    }),
    date: Joi.date().allow(null).empty('').optional(),
    description: Joi.string().max(255).allow(null).empty('').optional(),
    type: Joi.string().max(50).allow(null).empty('').optional(),
    method: Joi.string().max(50).allow(null).empty('').optional(),
    image: Joi.string()
        .pattern(/\.(jpg|jpeg|png|gif)$/i)
        .allow(null).empty('').optional()
        .custom((value, helpers) => {
            const maxSize = 500 * 1024; // 500 KB en bytes
            if (value && value.length > maxSize) {
                return helpers.message('El campo image debe ser una imagen válida de máximo 500 KB');
            }
            return value;
        }).messages({
            'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif)',
        }),
    id: Joi.number().required().messages({
        'number.base': '"id" debe ser un número',
        'any.required': '"id" es un campo obligatorio',
    }),
});

const idFinanceSchema = Joi.object({
    id: Joi.number().required().messages({
        'number.base': '"id" debe ser un número',
        'any.required': '"id" es un campo obligatorio',
    }),
});

const getFinanceSchema = Joi.object({
    home_id: Joi.number().integer().required().messages({
        'number.base': '"home_id" debe ser un número',
        'any.required': '"home_id" es un campo obligatorio',
    }),    
    type: Joi.string().required(),
});

module.exports = {
    storeFinanceSchema,
    updateFinanceSchema,
    idFinanceSchema,
    getFinanceSchema,
};
