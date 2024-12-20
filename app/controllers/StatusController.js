const logger = require('../../config/logger');
const { StatusRepository } = require('../repositories');

module.exports = {
    async index(req, res) {
        logger.info(`${req.user.name} - Accediendo a la lista de estados`);

        try {
            // Cargar solo los campos necesarios
            const status = await StatusRepository.findAll();

            // Mapear los resultados solo si es necesario
            const mappedStatus = status.map(status => {
                return {
                    id: status.id,
                    name: status.name,
                    description: status.description,
                    icon: status.icon,
                    color: status.color,
                    type: status.type
                };
            });

            // Si hay transformación, devolver los datos mapeados
            res.status(200).json({ status: mappedStatus });

        } catch (error) {
            logger.error('Error en StatusController->index: ' + error.message);
            res.status(500).json({ error: 'ServerError' });
        }
    },

    async store(req, res) {
        logger.info(`${req.user.name} - Creando un nuevo estado`);
      
        try {
    
            // Crear el registro de la persona
            let status = await StatusRepository.create(req.body);
                return res.status(201).json({
                    msg: 'StatusCreated',
                    status: status
                });
    
        } catch (error) {
            logger.error('Error en StatusController->store: ' + error.message);
            return res.status(500).json({ error: 'ServerError' });
        }
    },

    async show(req, res) {
        logger.info(`${req.user.name} - Accediendo a buscar un estado`);

        try {
            // Buscar persona por ID
            // Usar findByPk si estás buscando por clave primaria (id)
            const status = await StatusRepository.findById(req.body.id);  // findByPk en lugar de findById
            if (!status) {
                return res.status(404).json({ msg: 'StatusNotFound' });
            }
            // Mapear los resultados solo si es necesario
            const mappedStatus = {
                    id: status.id,
                    name: status.name,
                    description: status.description,
                    icon: status.icon,
                    color: status.color,
                    type: status.type,
                };

            // Si hay transformación, devolver los datos mapeados
            res.status(200).json({ status: mappedStatus });

        } catch (error) {
            logger.error('StatusController->show: ' + error.message);
            return res.status(500).json({ error: 'ServerError' });
        }
    },

    async update(req, res) {
        logger.info(`${req.user.name} - Editando un estado`);
   
        try {
            // Buscar el status por ID
            const status = await StatusRepository.findById(req.body.id);
            if (!status) {
                logger.error(`StatusController->update: Estado no encontrado con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'StatusNotFound' });
            }
    
            const statusUpdate = await StatusRepository.update(status, req.body)
    
            res.status(200).json({ msg: 'StatusUpdated', statusUpdate });
    
        } catch (error) {
            // Capturar errores del bloque try y registrarlos
            logger.error(`StatusController->update: Error al actualizar el estado: ${error.message}`);
            return res.status(500).json({ error: 'ServerError' });
        }
    },
    
    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando un estado`);
    
        try {
            // Buscar el status por ID
            const status = await StatusRepository.findById(req.body.id);
            if (!status) {
                logger.error(`StatusController->destroy: Estado no encontrado con ID ${req.body.id}`);
                return res.status(404).json({ msg: 'StatusNotFound' });
            }
    
            logger.info(`Estado eliminado exitosamente: ${status.name} (ID: ${status.id})`);
            // Eliminar el status de la base de datos
            const statusDelete = await StatusRepository.delete(status);
    
            res.status(200).json({ msg: 'StatusDeleted' });
    
        } catch (error) {
            // Capturar errores del bloque try y registrarlos
            logger.error(`StatusController->destroy: Error al eliminar el estado: ${error.message}`);
            return res.status(500).json({ error: 'ServerError' });
        }
    }
    
}