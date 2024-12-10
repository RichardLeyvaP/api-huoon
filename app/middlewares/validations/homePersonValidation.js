const Joi = require('joi');

const storeHomePersonSchema = Joi.object({
    home_id: Joi.number().required(),
    person_id: Joi.number().required(),
    role_id: Joi.number().required(),
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
            role_id: Joi.number().required()
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
