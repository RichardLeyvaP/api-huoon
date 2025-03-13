const Joi = require("joi");

// Esquema para crear un nuevo examen médico
const storeMedicalExamSchema = Joi.object({
  person_id: Joi.number().integer().optional().messages({
    "string.number": '"person_id" debe ser un number válido',
    "any.required": '"person_id" es un campo obligatorio',
  }),
  date: Joi.date().required().messages({
    "date.base": '"fecha" debe ser una fecha válida',
    "any.required": '"fecha" es un campo obligatorio',
  }),
  type_id: Joi.number().integer().required().messages({
    "string.number": '"type_id" debe ser un number válido',
    "any.required": '"type_id" es un campo obligatorio',
  }),
  result: Joi.string().allow(null).empty("").optional().messages({
    "string.base": '"resultado" debe ser una cadena de texto',
  }),
  archive: Joi.string()
      .pattern(/\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/i)
      .allow(null)
      .empty('')
      .optional()
      .messages({
          'string.pattern.base': 'El archivo debe ser una imagen (jpg, jpeg, png, gif) o un documento (pdf, doc, docx, txt)'
      }),
});

// Esquema para actualizar un examen médico
const updateMedicalExamSchema = Joi.object({
  person_id: Joi.number().integer().allow(null).empty("").optional().messages({
    "string.number": '"person_id" debe ser un number válido',
  }),
  date: Joi.date().allow(null).empty("").optional().messages({
    "date.base": '"fecha" debe ser una fecha válida',
  }),
  type_id: Joi.number().integer().allow(null).empty("").optional().messages({
    "string.number": '"type_id" debe ser un number válido',
  }),
  result: Joi.string().allow(null).empty("").optional().messages({
    "string.base": '"resultado" debe ser un numero entero',
  }),
  archive: Joi.string()
      .pattern(/\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/i)
      .allow(null)
      .empty('')
      .optional()
      .messages({
          'string.pattern.base': 'El archivo debe ser una imagen (jpg, jpeg, png, gif) o un documento (pdf, doc, docx, txt)'
      }),
  id: Joi.number().integer().required().messages({
    "string.number": '"id" debe ser un number válido',
    "any.required": '"id" es un campo obligatorio',
  }),
});

// Esquema para validar un ID de examen médico
const idMedicalExamSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "string.number": '"id" debe ser un number válido',
    "any.required": '"id" es un campo obligatorio',
  }),
});

// Esquema para obtener exámenes médicos por person_id
const getMedicalExamSchema = Joi.object({
  person_id: Joi.number().integer().allow(null).empty("").optional().messages({
    "string.number": '"person_id" debe ser un number válido',
    "any.required": '"person_id" es un campo obligatorio',
  }),
});

module.exports = {
  storeMedicalExamSchema,
  updateMedicalExamSchema,
  idMedicalExamSchema,
  getMedicalExamSchema,
};
