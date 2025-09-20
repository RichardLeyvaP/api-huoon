const logger = require('../../config/logger'); // Importa el logger
const { ActivityLogService } = require('../services');

const ActivityLogController = { 

    async getActivityLogsByModel(req, res) {
        logger.info(`${req.user.name} - Accediendo obtener las trazas de movimiento de productos`);
        const { home_id, startDate, endDate, person_id: bodyPersonId, type, model } = req.body;
        const person_id = bodyPersonId || req.person.id;
        const user_id = type === "Personal" ? req.user.id : null

        try {
            const activities = await ActivityLogService.getActivityLogsByHomeAndModelThisMonth(home_id, model, user_id, startDate, endDate);

            res.status(200).json({ 'activities': activities });
        } catch (error) {
            const errorMsg = error.details
            ? error.details.map(detail => detail.message).join(', ')
            : error.message || 'Error desconocido';
            logger.error('Error en RoleController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

};

module.exports = ActivityLogController;