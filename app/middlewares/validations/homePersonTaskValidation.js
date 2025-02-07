const Joi = require('joi');

const storeHomePersonTaskSchema = Joi.object({
    home_id: Joi.number().required(),
    person_id: Joi.number().required(),
    role_id: Joi.number().required(),
    task_id: Joi.number().required(),
    roleName: Joi.string().allow(null).empty("").optional(),
});

const updateHomePersonTaskSchema = Joi.object({
    home_id: Joi.number().required(),
    person_id: Joi.number().required(),
    role_id: Joi.number().optional(),
    task_id: Joi.number().optional(),
    id: Joi.number().required(),
});

const assignPeopleTaskSchema = Joi.object({
    task_id: Joi.number().required(),
    people: Joi.array().items(
        Joi.object({
            person_id: Joi.number().required(),
            role_id: Joi.number().required(),
            home_id: Joi.number().required(),
            roleName: Joi.string().allow(null).empty("").optional(),
        })
    ).required()
});

const idHomePersonTaskSchema = Joi.object({
    id: Joi.number().required()
});

module.exports = {
    storeHomePersonTaskSchema,
    updateHomePersonTaskSchema,
    idHomePersonTaskSchema,
    assignPeopleTaskSchema,
};
