const Joi = require('joi');

const storeTaskSchema = Joi.object({
    title: Joi.string().max(255).required(),
    description: Joi.string().optional().allow(null, '').empty('').default(null),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    start_time: Joi.string().optional().pattern(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/).allow(null), // Formato 24 horas
    end_time: Joi.string().optional().pattern(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/).allow(null), // Formato 24 horas
    type: Joi.string().optional().allow(null, '').empty(null),
    priority_id: Joi.number().integer().required(),
    parent_id: Joi.number().integer().allow(null, '').optional().empty(null),
    status_id: Joi.number().integer().required(),
    category_id: Joi.number().integer().required(),
    home_id: Joi.number().integer().required(),
    recurrence: Joi.string().optional().allow(null), // Puede ser nulo o cadena vacía
    estimated_time: Joi.number().integer().optional().allow(null),
    comments: Joi.string().optional().allow(null), // Puede ser nulo o cadena vacía
    attachments: Joi.string()
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
    geo_location: Joi.string().optional().allow(null, '').empty('').default(null),
    id: Joi.number().optional().allow(null),
    people: Joi.array().items(
        Joi.object({
            person_id: Joi.number().required(),
            role_id: Joi.number().required(),
            home_id: Joi.number().required()
        })
    ).optional()
});

const updateTaskSchema = Joi.object({
    title: Joi.string().max(255).optional(),
    description: Joi.string().optional().allow(null, '').empty('').default(null),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    start_time: Joi.string().optional().pattern(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/).allow(null), // Formato 24 horas
    end_time: Joi.string().optional().pattern(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/).allow(null), // Formato 24 horas
    type: Joi.string().optional().allow(null, '').empty(null),
    priority_id: Joi.number().integer().optional(),
    parent_id: Joi.number().integer().allow(null, '').optional().empty(null),
    status_id: Joi.number().integer().optional(),
    category_id: Joi.number().integer().optional(),
    home_id: Joi.number().integer().optional(),
    recurrence: Joi.string().optional().allow(null), // Puede ser nulo o cadena vacía
    estimated_time: Joi.number().integer().optional().allow(null),
    comments: Joi.string().optional().allow(null), // Puede ser nulo o cadena vacía
    attachments: Joi.string()
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
    geo_location: Joi.string().optional().allow(null, '').empty('').default(null),
    id: Joi.number().required(),
    people: Joi.array().items(
        Joi.object({
            person_id: Joi.number().required(),
            role_id: Joi.number().required(),
            home_id: Joi.number().required()
        })
    ).optional()
});

const idTaskSchema = Joi.object({
    id: Joi.number().required()
});

const getDateTaskSchema = Joi.object({
    start_date: Joi.date().required(),
    home_id: Joi.number().integer().required(),
});
const home_idTaskSchema = Joi.object({
    home_id: Joi.number().required(),
    type: Joi.string().required(),
});

module.exports = {
    storeTaskSchema,
    updateTaskSchema,
    idTaskSchema,
    getDateTaskSchema,
    home_idTaskSchema
};
