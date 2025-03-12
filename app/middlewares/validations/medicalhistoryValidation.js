const Joi = require("joi");

// Esquema para crear un nuevo historial médico (MedicalHistory)
const storeMedicalHistorySchema = Joi.object({
  familyBackground: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "Los antecedentes familiares deben ser una cadena de texto",
  }),
  personalBackground: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "Los antecedentes personales deben ser una cadena de texto",
  }),
  bloodType: Joi.string().max(10).optional().allow(null, "").empty("").default(null).messages({
    "string.base": "El grupo sanguíneo debe ser una cadena de texto",
    "string.max": "El grupo sanguíneo no puede tener más de 10 caracteres",
  }),
  vaccines: Joi.array()
      .items(
        Joi.object({
          id: Joi.number(),
          name: Joi.string(),
          date: Joi.date().allow(null).empty("").optional(),
          lot: Joi.string().allow(null).empty("").optional(),
        })
      )
      .optional(),
  currentMedications: Joi.array()
  .items(
    Joi.object({
      id: Joi.number(),
      name: Joi.string(),
      dose: Joi.string().allow(null).empty("").optional(),
      frequency: Joi.string().allow(null).empty("").optional(),
    })
  )
  .optional(),
  person_id: Joi.number().integer().optional().messages({
    "number.base": "El ID de la persona debe ser un número",
  }),
});

// Esquema para actualizar un historial médico (MedicalHistory)
const updateMedicalHistorySchema = Joi.object({
  familyBackground: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "Los antecedentes familiares deben ser una cadena de texto",
  }),
  personalBackground: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "Los antecedentes personales deben ser una cadena de texto",
  }),
  bloodType: Joi.string().max(10).optional().allow(null, "").empty("").default(null).messages({
    "string.base": "El grupo sanguíneo debe ser una cadena de texto",
    "string.max": "El grupo sanguíneo no puede tener más de 10 caracteres",
  }),
  vaccines: Joi.array()
      .items(
        Joi.object({
          id: Joi.number(),
          name: Joi.string(),
          date: Joi.date().allow(null).empty("").optional(),
          lot: Joi.string().allow(null).empty("").optional(),
        })
      )
      .optional(),
  currentMedications: Joi.array()
  .items(
    Joi.object({
      id: Joi.number(),
      name: Joi.string(),
      dose: Joi.string().allow(null).empty("").optional(),
      frequency: Joi.string().allow(null).empty("").optional(),
    })
  )
  .optional(),
  person_id: Joi.number().integer().optional().messages({
    "number.base": "El ID de la persona debe ser un número",
  }),
  id: Joi.number().integer().required().messages({
    "number.base": "El ID del historial médico debe ser un número",
    "any.required": "El ID del historial médico es requerido",
  }),
});

// Esquema para validar el ID de un historial médico (MedicalHistory)
const idMedicalHistorySchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});

// Esquema para validar el personId en consultas
const getMedicalHistorySchema = Joi.object({
  person_id: Joi.number().integer().required().messages({
    "number.base": "El ID de la persona debe ser un número",
    "any.required": "El ID de la persona es requerido",
  }),
});

module.exports = {
  storeMedicalHistorySchema,
  updateMedicalHistorySchema,
  idMedicalHistorySchema,
  getMedicalHistorySchema,
};