const { Configuration, User } = require('../models'); // Importa los modelos de Configuration y User
const logger = require('../../config/logger');
const { config } = require('dotenv');
const { HomeRepository } = require('../repositories');
module.exports = {    
    async show(req, res) 
    {
        logger.info(`${req.user.name} - Accediendo a la configuración`)
        try {
            const userId = req.user.id; // Supone que tienes el ID del usuario en `req.user`.
        // Buscar la configuración para el usuario
            let config = await Configuration.findOne({ where: { user_id: userId } });
    
        // Si no existe, obtener la configuración por defecto del sistema
       if (!config) {
            config = await Configuration.findOne({ where: { isDefault: true } });
        }

        const personId = req.person.id;

        const cantHome = await HomeRepository.findAllHomes(personId);
        // Construir la respuesta
        const userConfig = {
            userId: config.user_id,
            appName: config.appName,
            appVersion: config.appVersion,
            language: config.language,
            defaultCurrency: config.defaultCurrency,
            themeColor: config.themeColor,
            backgroundColor: config.backgroundColor,
            textColor: config.textColor,
            buttonColor: config.buttonColor,
            isDarkModeEnabled: !!config.isDarkModeEnabled, // Convertir a booleano
            notificationsEnabled: !!config.notificationsEnabled, // Convertir a booleano
            apiEndpoint: config.apiEndpoint,
            connectionTimeout: config.connectionTimeout,
            retryAttempts: config.retryAttempts,
            useBiometricAuth: !!config.useBiometricAuth, // Convertir a booleano
            requirePinForSensitiveActions: !!config.requirePinForSensitiveActions, // Convertir a booleano
            storagePath: config.storagePath,
            maxCacheSize: config.maxCacheSize,
            autoUpdateEnabled: !!config.autoUpdateEnabled, // Convertir a booleano
            supportContactEmail: config.supportContactEmail,
            lastSyncTime: config.lastSyncTime, // Formato ISO 8601
            fontSize: config.fontSize,
            cantHome: cantHome.length
        };

            // Devolver la configuración actualizada
            res.status(200).json({
            configurations: [userConfig]
            });
        } catch (error) {
            logger.error('Error al buscar las configuración: ' + error.message);
            res.status(500).json({ message: 'Error al buscar la configuración' });
        }
    },

    async update(req, res) 
    {
        logger.info(`${req.user.name} - Accediendo a actualizar la configuración`)
        try {
            const user = req.user; // Supone que tienes el ID del usuario en `req.user`.
        // Obtener la configuración por defecto del sistema
        const defaultConfig = await Configuration.findOne({ where: { isDefault: true } });

        // Intentar encontrar la configuración del usuario
        let userConfig = await Configuration.findOne({ where: { user_id: user.id } });

        // Si no existe, crear una nueva configuración para el usuario usando los valores por defecto
        if (!userConfig) {
            userConfig = await Configuration.create({ user_id: user.id, language: user.language });
        }

        // Si se proporciona un nuevo idioma, actualizar el idioma del usuario
        if (req.body.language) {
            const userData = await User.findByPk(user.id);
            if (!userData) {
                return res.status(404).json({ msg: 'UserNotFound' });
            }
            userData.language = req.body.language;
            await userData.save(); // Guarda los cambios en el usuario
        }

           // Filtrar los datos para actualizar solo los campos presentes
        const configData = {
            appName: req.body.appName || userConfig.appName || defaultConfig.appName,
            appVersion: req.body.appVersion || userConfig.appVersion || defaultConfig.appVersion,
            language: req.body.language || userConfig.language || defaultConfig.language,
            defaultCurrency: req.body.defaultCurrency || userConfig.defaultCurrency || defaultConfig.defaultCurrency,
            themeColor: req.body.themeColor || userConfig.themeColor || defaultConfig.themeColor,
            backgroundColor: req.body.backgroundColor || userConfig.backgroundColor || defaultConfig.backgroundColor,
            textColor: req.body.textColor || userConfig.textColor || defaultConfig.textColor,
            buttonColor: req.body.buttonColor || userConfig.buttonColor || defaultConfig.buttonColor,
            isDarkModeEnabled: req.body.isDarkModeEnabled !== undefined ? req.body.isDarkModeEnabled : userConfig.isDarkModeEnabled || defaultConfig.isDarkModeEnabled,
            notificationsEnabled: req.body.notificationsEnabled !== undefined ? req.body.notificationsEnabled : userConfig.notificationsEnabled || defaultConfig.notificationsEnabled,
            apiEndpoint: req.body.apiEndpoint || userConfig.apiEndpoint || defaultConfig.apiEndpoint,
            connectionTimeout: req.body.connectionTimeout || userConfig.connectionTimeout || defaultConfig.connectionTimeout,
            retryAttempts: req.body.retryAttempts || userConfig.retryAttempts || defaultConfig.retryAttempts,
            useBiometricAuth: req.body.useBiometricAuth !== undefined ? req.body.useBiometricAuth : userConfig.useBiometricAuth || defaultConfig.useBiometricAuth,
            requirePinForSensitiveActions: req.body.requirePinForSensitiveActions !== undefined ? req.body.requirePinForSensitiveActions : userConfig.requirePinForSensitiveActions || defaultConfig.requirePinForSensitiveActions,
            storagePath: req.body.storagePath || userConfig.storagePath || defaultConfig.storagePath,
            maxCacheSize: req.body.maxCacheSize || userConfig.maxCacheSize || defaultConfig.maxCacheSize,
            autoUpdateEnabled: req.body.autoUpdateEnabled !== undefined ? req.body.autoUpdateEnabled : userConfig.autoUpdateEnabled || defaultConfig.autoUpdateEnabled,
            supportContactEmail: req.body.supportContactEmail || userConfig.supportContactEmail || defaultConfig.supportContactEmail,
            lastSyncTime: req.body.lastSyncTime || userConfig.lastSyncTime || defaultConfig.lastSyncTime,
            fontSize: req.body.fontSize || userConfig.fontSize || defaultConfig.fontSize,
        };

        // Actualizar la configuración
        await userConfig.update(configData);

        return res.status(200).json({ msg: 'ConfigurationControllerOk', configuration: userConfig });
    } catch (error) {
        logger.error('Error al crear o actualizar la configuración: ' + error.message);
        return res.status(500).json({ msg: 'Error al crear o actualizar la configuración', error: error.message });
    }
    }
}