const Joi = require('joi');

const ShoppingListSchema = Joi.object({
  person_id: Joi.number().integer().positive().required().messages({
    'any.required': '"person_id" es obligatorio',
    'number.base': '"person_id" debe ser un número entero',
    'number.positive': '"person_id" debe ser positivo'
  }),
  home_id: Joi.number().integer().positive().required().messages({
    'any.required': '"home_id" es obligatorio',
    'number.positive': '"home_id" debe ser positivo'
  }),
  date: Joi.date().iso().required().messages({
    'any.required': '"date" es obligatorio (formato YYYY-MM-DD)',
    'date.format': '"date" debe tener formato ISO (YYYY-MM-DD)'
  }),
  person_home_warehouse_product: Joi.number().integer().positive().optional().allow(null),
  product_id: Joi.number().integer().positive().required().messages({
    'any.required': '"product_id" es obligatorio'
  }),
  product_name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': '"product_name" no puede estar vacío',
    'string.max': '"product_name" no puede exceder 200 caracteres'
  }),
  image: Joi.string().uri().optional().allow(null, '').messages({
    'string.uri': '"image" debe ser una URL válida si se proporciona'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': '"quantity" debe ser al menos 1',
    'number.integer': '"quantity" debe ser un entero'
  }),
  reason: Joi.string().max(255).optional().allow(null, ''),
  status: Joi.string().valid('pending', 'bought', 'cancelled').optional().default('pending')
});

const updateShoppingListSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'any.required': '"id" es obligatorio'
  }),
  date: Joi.date().iso().optional(),
  person_home_warehouse_product: Joi.number().integer().positive().optional().allow(null),
  product_id: Joi.number().integer().positive().optional(),
  product_name: Joi.string().trim().min(1).max(200).optional(),
  image: Joi.string().uri().optional().allow(null, ''),
  quantity: Joi.number().integer().min(1).optional(),
  reason: Joi.string().max(255).optional().allow(null, ''),
  status: Joi.string().valid('pending', 'bought', 'cancelled').optional()
})
  .messages({
    'object.missing': 'Debe enviar al menos un campo para actualizar'
  });

const idSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'any.required': '"id" es obligatorio'
  })
});

const getByHomeSchema = Joi.object({
  home_id: Joi.number().integer().positive().required()
});

const getByPersonSchema = Joi.object({
  person_id: Joi.number().integer().positive().required()
});

const getByHomePersonSchema = Joi.object({
  home_id: Joi.number().integer().positive().required(),
  person_id: Joi.number().integer().positive().optional()
});

const syncListSchema = Joi.object({
  person_id: Joi.number().integer().positive().required(),
  home_id: Joi.number().integer().positive().required(),
  products: Joi.array().items(
    Joi.object({
      person_home_warehouse_product_id: Joi.number().integer().positive().optional().allow(null),
      product_id: Joi.number().integer().positive().required(),
      name: Joi.string().trim().min(1).max(200).required(),
      image: Joi.string().uri().optional().allow(null, ''),
      quantity: Joi.number().integer().min(1).required(),
      reason: Joi.string().max(255).optional().allow(null, '')
    })
  ).required()
});

module.exports = {
  ShoppingListSchema,
  updateShoppingListSchema,
  idSchema,
  getByHomeSchema,
  getByPersonSchema,
  syncListSchema,
  getByHomePersonSchema
};