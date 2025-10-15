// src/repositories/householdRequest.repository.js

const { HouseholdRequest } = require('../models');
const { Op } = require('sequelize');
const HomeRepository = require('./HomeRepository');
const logger = require("../../config/logger");

const HouseholdRequestRepository = {
  /**
   * Crea una nueva solicitud de unión
   */
  async create(requestData, transaction = null) {
    try {
      const request = await HouseholdRequest.create(requestData, { transaction });
      return request;
    } catch (error) {
      throw new Error(`Error al crear la solicitud de unión: ${error.message}`);
    }
  },

  /**
   * Obtiene una solicitud por ID
   */
  async findById(id, transaction = null) {
    try {
      const request = await HouseholdRequest.findByPk(id, { transaction });
      return request;
    } catch (error) {
      throw new Error(`Error al buscar la solicitud por ID ${id}: ${error.message}`);
    }
  },

  /**
   * Genera un código único de 6 dígitos, lo asigna a la solicitud,
   * y establece resetCode como el timestamp de expiración (48 horas).
   * Devuelve el código en texto plano.
   */
  async generateAndSetCode(id, moduleId = null, transaction = null) {
    const maxAttempts = 20;
    const expirationTimestamp = Date.now() + 48 * 60 * 60 * 1000; // 48 horas en ms

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Generar código de 6 dígitos (100000 - 999999)
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Verificar si YA EXISTE un código igual y ACTIVO (no expirado)
        const activeRequestWithSameCode = await HouseholdRequest.findOne({
          where: {
            code: code,
            resetCode: { [Op.gt]: Date.now() } // aún vigente
          },
          transaction
        });

        if (activeRequestWithSameCode) {
          // Código en uso → intentar con otro
          continue;
        }

        // Construir los campos a actualizar
        const updateData = {
          code: code,
          resetCode: expirationTimestamp
        };

        // Si se pasa moduleId, incluirlo en la actualización
        if (moduleId !== null && moduleId !== undefined) {
          updateData.moduleId = moduleId;
        }

        // Actualizar la solicitud
        const [updatedRows] = await HouseholdRequest.update(
          updateData,
          {
            where: { id: id },
            transaction
          }
        );

        if (updatedRows === 0) {
          throw new Error(`No se encontró la solicitud con ID ${id}`);
        }

        return code; // éxito

      } catch (error) {
        // Si es el último intento, lanzamos el error
        if (attempt === maxAttempts - 1) {
          throw new Error(`No se pudo generar un código único tras ${maxAttempts} intentos: ${error.message}`);
        }
        // De lo contrario, continuamos con el siguiente intento
      }
    }

    // Este punto no debería alcanzarse, pero por seguridad:
    throw new Error('Fallo inesperado al generar código');
  },

  /**
   * Verifica si un código es válido (existe y no ha expirado)
   */
  async verifyCode(codeToVerify) {
    try {
      const request = await HouseholdRequest.findOne({
        where: {
          code: codeToVerify,
          resetCode: { [Op.gt]: Date.now() } // aún dentro de las 48h
        }
      });

       if (!request) {
      return { found: false,  home:null };
    }

    const { module, moduleId } = request;

    // 2. Validar que moduleId exista
    if (!moduleId) {
      return { found: false,  home:null };
    }

    let data = null;

    if (module === 'House') {
      data = await HomeRepository.findById(moduleId);
      // Si el home no existe, el código no es válido
      if (!data) {
        return { found: false,  data };
      }
    }
    // Puedes añadir más módulos aquí en el futuro:
    // else if (module === 'Team') { ... }

    // Si el módulo no es reconocido, también es inválido
    if (data === null && module !== 'House') {
      return { found: false, data };
    }

    await request.update({ resetCode: 0 });
    return { found: true, data };
    } catch (error) {
      throw new Error(`Error al verificar el código: ${error.message}`);
    }
  },

  /**
   * Opcional: Obtener la solicitud completa por código válido
   */
  async findByCode(codeToVerify) {
    try {
      const request = await HouseholdRequest.findOne({
        where: {
          code: codeToVerify,
          resetCode: { [Op.gt]: Date.now() }
        }
      });
      return request;
    } catch (error) {
      throw new Error(`Error al buscar solicitud por código: ${error.message}`);
    }
  },
}

module.exports = HouseholdRequestRepository;