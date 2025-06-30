const Joi = require("joi");

// Expresiones regulares para validar tipos de archivos
const imageRegex = /\.(jpg|jpeg|png|gif)$/i;
const documentRegex = /\.(pdf|doc|docx|txt)$/i;

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
  type_id: Joi.number().integer().allow(null, "").optional().empty(null).messages({
    "string.number": '"type_id" debe ser un number válido',
    "any.required": '"type_id" es un campo obligatorio',
  }),
  exam_name: Joi.string().max(200).allow(null, '').optional().messages({
    "string.base": '"exam_name" debe ser una cadena de texto',
    "string.max": '"exam_name" no debe exceder los 200 caracteres'
  }),
  results: Joi.string().allow(null, '').optional().messages({
    "string.base": '"results" debe ser una cadena de texto',
  }),
  observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"observations" debe ser una cadena de texto',
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
  type_id: Joi.number().integer().allow(null).empty("").optional().messages({
    "string.number": '"type_id" debe ser un number válido',
  }),
  date: Joi.date().allow(null).empty("").optional().messages({
    "date.base": '"fecha" debe ser una fecha válida',
  }),
  exam_name: Joi.string().max(200).allow(null, '').optional().messages({
    "string.base": '"exam_name" debe ser una cadena de texto',
    "string.max": '"exam_name" no debe exceder los 200 caracteres'
  }),
  results: Joi.string().allow(null, '').optional().messages({
    "string.base": '"results" debe ser una cadena de texto',
  }),
  observations: Joi.string().allow(null, '').optional().messages({
    "string.base": '"observations" debe ser una cadena de texto',
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
