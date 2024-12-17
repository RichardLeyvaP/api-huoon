const Joi = require('joi');

const storePersonProductSchema = Joi.object({
    home_id: Joi.number().integer().required(),
    warehouse_id: Joi.number().integer().required(),
    product_id: Joi.number().integer().optional().allow(null).empty('').messages({
        'number.base': '"product_id" debe ser un número',
        'number.integer': '"product_id" debe ser un número entero',
      }),
    status_id: Joi.number().integer().required(),
    category_id: Joi.number().integer().allow(null).empty('').optional(),
    name: Joi.string().max(255).required(),
    unit_price: Joi.number().precision(2).required(),
    quantity: Joi.number().required(),
    total_price: Joi.number().precision(2).allow(null).empty('').optional(),
    purchase_date: Joi.date().allow(null).empty('').optional(),
    purchase_place: Joi.string().allow(null).empty('').optional(),
    expiration_date: Joi.date().allow(null).empty('').optional(),
    brand: Joi.string().allow(null).empty('').optional(),
    additional_notes: Joi.string().allow(null).empty('').optional(),
    maintenance_date: Joi.date().allow(null).empty('').optional(),
    due_date: Joi.date().allow(null).empty('').optional(),
    frequency: Joi.string().allow(null).empty('').optional(),
    type: Joi.string().allow(null).empty('').optional(),
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
    }), // Puede ser nulo o cadena vacía
});

const updatePersonProductSchema = Joi.object({
    home_id: Joi.number().integer().allow(null).empty('').optional(),
    warehouse_id: Joi.number().integer().allow(null).empty('').optional(),
    product_id: Joi.number().integer().allow(null).empty('').optional(),
    status_id: Joi.number().integer().allow(null).empty('').optional(),
    category_id: Joi.number().integer().allow(null).empty('').optional(),
    name: Joi.string().max(255).allow(null).empty('').optional(),
    unit_price: Joi.number().precision(2).allow(null).empty('').optional(),
    quantity: Joi.number().allow(null).empty('').optional(),
    total_price: Joi.number().precision(2).allow(null).empty('').optional(),
    purchase_date: Joi.date().allow(null).empty('').optional(),
    purchase_place: Joi.string().allow(null).empty('').optional(),
    expiration_date: Joi.date().allow(null).empty('').optional(),
    brand: Joi.string().allow(null).empty('').optional(),
    additional_notes: Joi.string().allow(null).empty('').optional(),
    maintenance_date: Joi.date().allow(null).empty('').optional(),
    due_date: Joi.date().allow(null).empty('').optional(),
    frequency: Joi.string().allow(null).empty('').optional(),
    type: Joi.string().allow(null).empty('').optional(),
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
    }), // Puede ser nulo o cadena vacía
    id: Joi.number().required()
});

const idPersonProductSchema = Joi.object({
    id: Joi.number().required()
});

const getPersonHomeProductSchema = Joi.object({
    warehouse_id: Joi.date().required(),
    home_id: Joi.date().required(),
});

module.exports = {
    storePersonProductSchema,
    updatePersonProductSchema,
    idPersonProductSchema,
    getPersonHomeProductSchema
};
