const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(3).required(), // nombre entre 3 y 30 caracteres
    user: Joi.string().min(3).optional().allow(null, '').empty('').default(null), // nombre entre 3 y 30 caracteres
    email: Joi.string().email().required(),       // email válido y obligatorio
    password: Joi.string().min(5).required(),     // contraseña de al menos 6 caracteres
    language: Joi.string().valid('es', 'en', 'pt').default('es') // 'es' por defecto, acepta solo los valores 'es', 'en', 'fr'
});

const loginSchema = Joi.object({
    email: Joi.string().min(3).required(), // nombre entre 3 y 30 caracteres
    password: Joi.string().min(5).required(),     // contraseña de al menos 6 caracteres
});

const updatePasswordSchema = Joi.object({
    id: Joi.number().integer().required().messages({
        'any.required': 'El ID del usuario es obligatorio.',
        'number.base': 'El ID del usuario debe ser un número.',
        'number.integer': 'El ID del usuario debe ser un entero.',
    }),
    currentPassword: Joi.string().allow('').optional().messages({
        'string.base': 'La contraseña actual debe ser un texto.',
    }),
    newPassword: Joi.string().min(8).required().messages({
        'any.required': 'La nueva contraseña es obligatoria.',
        'string.min': 'La nueva contraseña debe tener al menos 8 caracteres.',
    }),
});

const googgleApkSchema = Joi.object({
    id: Joi.string().pattern(/^\d+$/).required(), // Solo números en formato string
    name: Joi.string().min(3).max(100).required(), // Nombre entre 3 y 100 caracteres
    email: Joi.string().email().required(), // Email válido y obligatorio
    image: Joi.string().uri().required() // URL válida y obligatoria
  });

module.exports = {
    registerSchema,
    loginSchema,
    updatePasswordSchema,
    googgleApkSchema
};
