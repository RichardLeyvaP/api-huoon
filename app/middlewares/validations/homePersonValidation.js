const Joi = require('joi');

const storeHomePersonSchema = Joi.object({
    home_id: Joi.number().required(),
    person_id: Joi.number().required(),
    role_id: Joi.number().required(),
    roleName: Joi.string().allow(null).empty("").optional(),
});

const updateHomePersonSchema = Joi.object({
    home_id: Joi.number().required(),
    person_id: Joi.number().required(),
    role_id: Joi.number().optional(),
    id: Joi.number().required(),
});

const assignPeopleSchema = Joi.object({
    home_id: Joi.number().required(),
    people: Joi.array().items(
        Joi.object({
            person_id: Joi.number().required(),
            role_id: Joi.number().required(),
            roleName: Joi.string().allow(null).empty("").optional(),
        })
    ).required()
});

const idHomePersonSchema = Joi.object({
    id: Joi.number().required()
});

module.exports = {
    storeHomePersonSchema,
    updateHomePersonSchema,
    idHomePersonSchema,
    assignPeopleSchema,
};
