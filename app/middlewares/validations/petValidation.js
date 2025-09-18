const Joi = require('joi');

// Esquema para crear una mascota
const storePetSchema = Joi.object({
  name: Joi.string().max(255).required().messages({
    'string.base': '"name" debe ser un texto.',
    'string.max': '"name" no debe exceder {#limit} caracteres.',
    'any.required': '"name" es obligatorio.'
  }),

  category_id: Joi.number().integer().required().messages({
    'number.base': '"category_id" debe ser un número.',
    'number.integer': '"category_id" debe ser un número entero.',
    'any.required': '"category_id" es obligatorio.'
  }),

  breed: Joi.string().max(100).allow(null, '').optional().messages({
    'string.max': '"breed" no debe exceder {#limit} caracteres.'
  }),

  sex: Joi.string().allow(null, '').optional().messages({
    'any.only': '"sex" debe ser "male", "female" o "other".'
  }),

  age: Joi.number().integer().min(0).max(100).allow(null).empty('').optional().messages({
    'number.integer': '"age" debe ser un número entero.',
    'number.min': '"age" no puede ser negativo.',
    'number.max': '"age" parece demasiado alto.'
  }),

  date_birth: Joi.date().allow(null, '').optional().messages({
    'date.base': '"date_birth" debe ser una fecha válida.'
  }),

  color: Joi.string().max(50).allow(null, '').optional().messages({
    'string.max': '"color" no debe exceder {#limit} caracteres.'
  }),

  microchip: Joi.string().max(50).allow(null, '').optional().messages({
    'string.max': '"microchip" no debe exceder {#limit} caracteres.'
  }),

  signs: Joi.string().allow(null, '').optional().messages({
    'string.base': '"signs" debe ser un texto.'
  }),

  type: Joi.string().valid('Personal', 'Hogar').allow(null, '').optional().messages({
    'any.only': '"type" debe ser "Personal" o "Hogar".'
  }),

  home_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"home_id" debe ser un número entero.'
  }),

  person_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"person_id" debe ser un número entero.'
  }),

  image: Joi.string()
    .pattern(/\.(jpg|jpeg|png|gif)$/i)
    .allow(null, '')
    .optional()
    .custom((value, helpers) => {
      if (!value) return value;
      // Simulación de validación de tamaño (en frontend/backend real se verifica el buffer)
      // Aquí asumimos que el valor es una URL o base64, y no podemos medir tamaño real
      // Pero mantenemos el mensaje para coherencia
      const maxSize = 500 * 1024; // 500 KB
      // Nota: en un sistema real, esto se haría en multer o middleware
      return value; // No se puede validar tamaño aquí sin el buffer
    })
    .messages({
      'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif).'
    })
});

// Esquema para actualizar una mascota
const updatePetSchema = Joi.object({
  name: Joi.string().max(255).allow(null, '').optional().messages({
    'string.max': '"name" no debe exceder {#limit} caracteres.'
  }),
  category_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"category_id" debe ser un número entero.'
  }),
  breed: Joi.string().max(100).allow(null, '').optional().messages({
    'string.max': '"breed" no debe exceder {#limit} caracteres.'
  }),
  sex: Joi.string().allow(null, '').optional().messages({
    'any.only': '"sex" debe ser "male", "female" o "other".'
  }),
  age: Joi.number().integer().min(0).max(100).allow(null, '').optional().messages({
    'number.integer': '"age" debe ser un número entero.',
    'number.min': '"age" no puede ser negativo.',
    'number.max': '"age" parece demasiado alto.'
  }),
  date_birth: Joi.date().allow(null, '').optional().messages({
    'date.base': '"date_birth" debe ser una fecha válida.'
  }),
  color: Joi.string().max(50).allow(null, '').optional().messages({
    'string.max': '"color" no debe exceder {#limit} caracteres.'
  }),
  microchip: Joi.string().max(50).allow(null, '').optional().messages({
    'string.max': '"microchip" no debe exceder {#limit} caracteres.'
  }),
  signs: Joi.string().allow(null, '').optional().messages({
    'string.base': '"signs" debe ser un texto.'
  }),
  type: Joi.string().valid('Personal', 'Hogar').allow(null, '').optional().messages({
    'any.only': '"type" debe ser "Personal" o "Hogar".'
  }),
  home_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"home_id" debe ser un número entero.'
  }),
  person_id: Joi.number().integer().allow(null, '').optional().messages({
    'number.integer': '"person_id" debe ser un número entero.'
  }),
  image: Joi.string()
    .pattern(/\.(jpg|jpeg|png|gif)$/i)
    .allow(null, '')
    .optional()
    .custom((value, helpers) => {
      if (!value) return value;
      // Nota: como antes, no se puede validar tamaño real sin buffer
      return value;
    })
    .messages({
      'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif).'
    }),

  id: Joi.number().integer().required().messages({
    'any.required': '"id" es obligatorio para actualizar.',
    'number.integer': '"id" debe ser un número entero.'
  })
}).min(1); // Al menos un campo debe estar presente

const idPetSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    'any.required': '"id" es obligatorio.',
    'number.integer': '"id" debe ser un número entero.'
  })
});

const getPetsSchema = Joi.object({
  home_id: Joi.number().integer().allow(null, '').optional(),
  pet_id: Joi.number().integer().allow(null, '').optional(),
  person_id: Joi.number().integer().allow(null, '').optional(),
  category_id: Joi.number().integer().allow(null, '').optional(),
  type: Joi.string().valid('Personal', 'Hogar').allow(null, '').optional(),
  status: Joi.string().allow(null, '').optional() // si en el futuro agregas estado
});



module.exports = {
  storePetSchema,
  updatePetSchema,
  idPetSchema,
  getPetsSchema
};