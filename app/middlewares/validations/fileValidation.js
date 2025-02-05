const Joi = require('joi');

// Expresiones regulares para validar tipos de archivos
const imageRegex = /\.(jpg|jpeg|png|gif)$/i;
const documentRegex = /\.(pdf|doc|docx|txt)$/i;

// Esquema para crear un archivo
const storeFileSchema = Joi.object({
    name: Joi.string().max(255).required().messages({
        'string.base': '"name" debe ser una cadena de texto',
        'string.max': '"name" no debe exceder los 255 caracteres',
        'any.required': '"name" es un campo obligatorio',
    }),
    archive: Joi.string()
    .pattern(/\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/i)
    .allow(null)
    .empty('')
    .optional()
    .messages({
        'string.pattern.base': 'El archivo debe ser una imagen (jpg, jpeg, png, gif) o un documento (pdf, doc, docx, txt)'
    }),
    date: Joi.date().default(Date.now).messages({
        'date.base': '"date" debe ser una fecha válida',
    }),
    description: Joi.string().max(255).allow(null).empty('').optional().messages({
        'string.base': '"desc" debe ser una cadena de texto',
        'string.max': '"desc" no debe exceder los 255 caracteres',
    }),
    home_id: Joi.number().integer().required().messages({
        'number.base': '"homeId" debe ser un número',
        'number.integer': '"homeId" debe ser un número entero',
    }),
    personal: Joi.number().integer().valid(0, 1).default(1).messages({
        'number.base': '"personal" debe ser un número',
        'number.integer': '"personal" debe ser un número entero',
        'any.only': '"personal" debe ser 0 o 1',
    }),
});

// Esquema para actualizar un archivo
const updateFileSchema = Joi.object({
    name: Joi.string().max(255).optional().messages({
        'string.base': '"name" debe ser una cadena de texto',
        'string.max': '"name" no debe exceder los 255 caracteres',
    }),
    archive: Joi.string()
    .pattern(/\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/i)
    .allow(null)
    .empty('')
    .optional()
    .messages({
        'string.pattern.base': 'El archivo debe ser una imagen (jpg, jpeg, png, gif) o un documento (pdf, doc, docx, txt)'
    }),
    date: Joi.date().optional().messages({
        'date.base': '"date" debe ser una fecha válida',
    }),
    description: Joi.string().max(255).allow(null).empty('').optional().messages({
        'string.base': '"desc" debe ser una cadena de texto',
        'string.max': '"desc" no debe exceder los 255 caracteres',
    }),
    home_id: Joi.number().integer().allow(null).empty('').optional().messages({
        'number.base': '"homeId" debe ser un número',
        'number.integer': '"homeId" debe ser un número entero',
    }),
    personal: Joi.number().integer().valid(0, 1).optional().messages({
        'number.base': '"personal" debe ser un número',
        'number.integer': '"personal" debe ser un número entero',
        'any.only': '"personal" debe ser 0 o 1',
    }),
    id: Joi.number().integer().required().messages({
        'number.base': '"id" debe ser un número',
        'number.integer': '"id" debe ser un número entero',
        'any.required': '"id" es un campo obligatorio',
    }),
});

// Esquema para obtener un archivo por ID
const idFileSchema = Joi.object({
    home_id: Joi.number().integer().required().messages({
        'number.base': '"homeId" debe ser un número',
        'number.integer': '"homeId" debe ser un número entero',
    }),
});

const typeFileSchema = Joi.object({
    home_id: Joi.number().integer().required().messages({
        'number.base': '"id" debe ser un número',
        'number.integer': '"id" debe ser un número entero',
        'any.required': '"id" es un campo obligatorio',
    }),
    personal: Joi.number().integer().allow(null).empty('').optional().messages({
        'number.base': '"personal" debe ser un número',
        'number.integer': '"personal" debe ser un número entero',
        'any.only': '"personal" debe ser 0 o 1',
    }),
});

module.exports = {
    storeFileSchema,
    updateFileSchema,
    idFileSchema,
    typeFileSchema
};