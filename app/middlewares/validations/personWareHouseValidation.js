const Joi = require('joi');

const storePersonWareHouseSchema = Joi.object({
    title: Joi.string().max(255).required(),
    description: Joi.string().allow(null).empty('').optional(),
    location: Joi.string().allow(null).empty('').optional(),
    status: Joi.number().integer().valid(0, 1).default(0).allow(null).empty('').optional(),
    home_id: Joi.number().integer().required(), // ID del hogar requerido al crear o actualizar
    warehouse_id: Joi.number().integer().allow(null).empty('').optional() // ID del almacén requerido al crear o actualizar
});

const updatePersonWareHouseSchema = Joi.object({
    title: Joi.string().max(255).allow(null).empty('').optional(),
    description: Joi.string().allow(null).empty('').optional(),
    location: Joi.string().allow(null).empty('').optional(),
    status: Joi.number().allow(null).empty('').optional(),
    home_id: Joi.number().integer().allow(null).empty('').optional(), // ID del hogar requerido al crear o actualizar
    id: Joi.number().integer().required(), // ID del hogar requerido al crear o actualizar
    warehouse_id: Joi.number().integer().allow(null).empty('').optional() // ID del almacén requerido al crear o actualizar
});

const idPersonWareHouseSchema = Joi.object({
    id: Joi.number().required()
});

const getWarehouseSchema = Joi.object({
    home_id: Joi.number().required(),
    person_id: Joi.number().integer().allow(null).empty('').optional() ,
    type: Joi.string().allow(null).empty('').optional(),
});

const moveProductSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'any.required': 'El ID del registro es obligatorio',
    'number.base': 'El ID debe ser un número',
    'number.integer': 'El ID debe ser un entero',
    'number.positive': 'El ID debe ser positivo',
  }),

  warehouse_id: Joi.number().integer().positive().required().messages({
    'any.required': 'El ID del almacén es obligatorio',
    'number.base': 'El ID del almacén debe ser un número',
    'number.integer': 'El ID del almacén debe ser un entero',
    'number.positive': 'El ID del almacén debe ser positivo',
  }),

  product_id: Joi.number().integer().positive().required().messages({
    'any.required': 'El ID del producto es obligatorio',
    'number.base': 'El ID del producto debe ser un número',
    'number.integer': 'El ID del producto debe ser un entero',
    'number.positive': 'El ID del producto debe ser positivo',
  }),

  quantity: Joi.number().integer().min(1).required().messages({
    'any.required': 'La cantidad actual en inventario es obligatoria',
    'number.base': 'La cantidad debe ser un número',
    'number.integer': 'La cantidad debe ser un entero',
    'number.min': 'La cantidad debe ser al menos 1',
  }),

  unit_price: Joi.alternatives()
    .try(
      Joi.number().min(0),
      Joi.string().pattern(/^\d+(\.\d{1,2})?$/)
    )
    .required()
    .messages({
      'any.required': 'El precio unitario es obligatorio',
      'alternatives.types': 'El precio unitario debe ser un número o string decimal válido (0.00)',
    }),

  total_price: Joi.alternatives()
    .try(
      Joi.number().min(0),
      Joi.string().pattern(/^\d+(\.\d{1,2})?$/)
    )
    .required()
    .messages({
      'any.required': 'El precio total es obligatorio',
      'alternatives.types': 'El precio total debe ser un número o string decimal válido (0.00)',
    }),

  quantity_mov: Joi.alternatives()
    .try(
      Joi.number().integer().min(1),
      Joi.string().pattern(/^\d+$/)
    )
    .required()
    .custom((value, helpers) => {
      const quantity = helpers.state.ancestors[0].quantity; // Accede a quantity del mismo nivel
      const mov = parseInt(value, 10);

      if (mov > quantity) {
        return helpers.error('any.invalid', {
          message: `La cantidad a mover (${mov}) no puede ser mayor que la disponible (${quantity})`,
        });
      }
      return mov;
    })
    .messages({
      'any.required': 'La cantidad a mover es obligatoria',
      'any.invalid': '{{#message}}',
      'alternatives.types': 'La cantidad a mover debe ser un número entero positivo',
    }),
});

module.exports = {
    storePersonWareHouseSchema,
    updatePersonWareHouseSchema,
    idPersonWareHouseSchema,
    getWarehouseSchema,
    moveProductSchema
};
