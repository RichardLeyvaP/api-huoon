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
    home_id: Joi.number().required()
});

module.exports = {
    storePersonWareHouseSchema,
    updatePersonWareHouseSchema,
    idPersonWareHouseSchema,
    getWarehouseSchema,
};
