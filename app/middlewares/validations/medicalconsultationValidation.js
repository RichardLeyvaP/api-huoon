const Joi = require("joi");

// Esquema para crear una nueva consulta médica (MedicalConsultation)
const storeMedicalConsultationSchema = Joi.object({
 person_id: Joi.number().integer().optional().messages({
     "number.base": "El ID de la persona debe ser un número",
   }),
  date: Joi.date().required().messages({
    "date.base": "La fecha de la consulta debe ser una fecha válida",
    "any.required": "La fecha de la consulta es requerida",
  }),
  reason: Joi.string().required().messages({
    "string.base": "El motivo de la consulta debe ser una cadena de texto",
    "any.required": "El motivo de la consulta es requerido",
  }),
  diagnosis: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "El diagnóstico debe ser una cadena de texto",
  }),
  treatments: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().required().messages({
          "number.base": "El ID del tratamiento debe ser un número",
          "any.required": "El ID del tratamiento es requerido",
        }),
        name: Joi.string().required().messages({
          "string.base": "El nombre del tratamiento debe ser una cadena de texto",
          "any.required": "El nombre del tratamiento es requerido",
        }),
      })
    )
    .optional(),
  medicalNotes: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "Las notas médicas deben ser una cadena de texto",
  }),
  files: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().required().messages({
          "number.base": "El ID del archivo debe ser un número",
          "any.required": "El ID del archivo es requerido",
        }),
        name: Joi.string().required().messages({
          "string.base": "El nombre del archivo debe ser una cadena de texto",
          "any.required": "El nombre del archivo es requerido",
        }),
      })
    )
    .optional(),
});

// Esquema para actualizar una consulta médica (MedicalConsultation)
const updateMedicalConsultationSchema = Joi.object({
  person_id: Joi.number().integer().optional().messages({
    "number.base": "El ID de la persona debe ser un número",
  }),
  date: Joi.date().optional().messages({
    "date.base": "La fecha de la consulta debe ser una fecha válida",
  }),
  reason: Joi.string().optional().messages({
    "string.base": "El motivo de la consulta debe ser una cadena de texto",
  }),
  diagnosis: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "El diagnóstico debe ser una cadena de texto",
  }),
  treatments: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().required().messages({
          "number.base": "El ID del tratamiento debe ser un número",
          "any.required": "El ID del tratamiento es requerido",
        }),
        name: Joi.string().required().messages({
          "string.base": "El nombre del tratamiento debe ser una cadena de texto",
          "any.required": "El nombre del tratamiento es requerido",
        }),
      })
    )
    .optional(),
  medicalNotes: Joi.string().optional().allow(null, "").empty("").default(null).messages({
    "string.base": "Las notas médicas deben ser una cadena de texto",
  }),
  files: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().required().messages({
          "number.base": "El ID del archivo debe ser un número",
          "any.required": "El ID del archivo es requerido",
        }),
        name: Joi.string().required().messages({
          "string.base": "El nombre del archivo debe ser una cadena de texto",
          "any.required": "El nombre del archivo es requerido",
        }),
      })
    )
    .optional(),
  id: Joi.number().integer().required().messages({
    "number.base": "El ID de la consulta médica debe ser un número",
    "any.required": "El ID de la consulta médica es requerido",
  }),
});

// Esquema para validar el ID de una consulta médica (MedicalConsultation)
const idMedicalConsultationSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "El ID debe ser un número",
    "any.required": "El ID es requerido",
  }),
});

// Esquema para validar el personId en consultas
const getMedicalConsultationSchema = Joi.object({
  person_id: Joi.number().integer().required().messages({
    "number.base": "El ID de la persona debe ser un número",
    "any.required": "El ID de la persona es requerido",
  }),
});

module.exports = {
  storeMedicalConsultationSchema,
  updateMedicalConsultationSchema,
  idMedicalConsultationSchema,
  getMedicalConsultationSchema,
};