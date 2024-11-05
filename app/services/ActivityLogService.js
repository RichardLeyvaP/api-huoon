
const { ActivityLog } = require('../models'); // Asegúrate de que la ruta es correcta y que está exportando el modelo

class ActivityLogService {
    async createActivityLog(modelName, modelId, action, userId, newData) {
        try {
            const activityLog = await ActivityLog.create({
                modelName: modelName || "DefaultModel", // Usa el valor o uno por defecto
                modelId: modelId,
                action: action || "create", // Valor predeterminado
                userId: userId,
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
}

module.exports = new ActivityLogService();
