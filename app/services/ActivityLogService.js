
const logger = require('../../config/logger');
const { ActivityLog, sequelize } = require('../models'); // Asegúrate de que la ruta es correcta y que está exportando el modelo
const { Op } = require('sequelize'); // ← ¡Importante!
class ActivityLogService {
    async createActivityLog(modelName, modelId, action, userId, newData, home_id = null) {
        try {
            const activityLog = await ActivityLog.create({
                modelName: modelName || "DefaultModel", // Usa el valor o uno por defecto
                modelId: modelId,
                action: action || "create", // Valor predeterminado
                userId: userId,
                home_id: home_id || null,
                newData: newData || null, // Acepta null si no hay nuevos datos
            });
            return activityLog;
        } catch (error) {
            throw new Error('Error al crear el registro de actividad: ' + error.message);
        }
    }

    async getActivityLogs() {
        try {
            const logs = await ActivityLog.findAll();
            return logs;
        } catch (error) {
            throw new Error('Error al obtener los registros de actividad: ' + error.message);
        }
    }

    /**
   * Obtiene registros de actividad para un home_id y modelName en el mes actual.
   * Filtra por createdAt (solo fecha, sin hora).
   * @param {number} home_id
   * @param {string} modelName
   * @returns {Promise<Array>}
   */
  async getActivityLogsByHomeAndModelThisMonth(home_id, modelName, user_id = null, startDate = null, endDate = null) {
  try {
    let start, end;

    if (!startDate || !endDate) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      start = `${year}-${month}-01`;
      const nextMonth = now.getMonth() + 2;
      const nextYear = nextMonth > 12 ? year + 1 : year;
      const endMonth = nextMonth > 12 ? '01' : String(nextMonth).padStart(2, '0');
      end = `${nextYear}-${endMonth}-01`;
    } else {
      start = startDate;
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      end = endDateObj.toISOString().split('T')[0];
    }

    const where = {
      home_id: home_id,
      modelName: modelName,
      createdAt: {
        [Op.gte]: start,
        [Op.lt]: end,
      },
    };

    if (user_id != null) {
      where.userId = user_id;
    }

    const logs = await ActivityLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    // ✅ Parsear newData en cada registro
    return logs.map(log => {
      const parsedLog = log.get({ plain: true }); // ← Convierte a objeto plano (sin métodos de Sequelize)

      try {
        // Intentar parsear newData
        if (typeof parsedLog.newData === 'string') {
          parsedLog.newData = JSON.parse(parsedLog.newData);
        }
      } catch (e) {
        logger.error('Error parsing newData for log ID:', parsedLog.id, e.message);
        parsedLog.newData = null; // o parsedLog.newData (dejar como string si prefieres)
      }

      return parsedLog;
    });
  } catch (error) {
    throw new Error('Error al obtener registros del mes actual: ' + error.message);
  }
}
}

module.exports = new ActivityLogService();
