const logger = require('../../config/logger');
const { StatusRepository, TaskRepository, WishRepository, FinanceRepository, PersonWareHouseRepository, HomeRepository, FileRepository, PersonProductRepository, SuggestionRepository } = require('../repositories');
const { StatusService } = require('../services');

const StatusController = {
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
    },
    async getLocalISODate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
    },
    async findByType(req, res) {
        logger.info(`${req.user.name} - Buscando estados por tipo: ${req.body.type}`);

        try {
            const { type, home_id } = req.body; // Obtener el type de los parámetros de la ruta

            // Obtener los estados filtrados por type desde el repositorio
            const statuses = await StatusService.getStatus(type);

            const personId = req.person.id;

            const date = await StatusController.getLocalISODate();
            // Obtener solo las tareas principales (sin padre) directamente en la consulta
            const tasks = await TaskRepository.findAllDateWeb(
                date,
                personId,
                home_id
            );
            const filteredTasks = tasks.filter(task => 
                task.type && task.type.toLowerCase() === 'tarea'
                // O alternativamente si usas typeName:
                // task.typeName && task.typeName.toLowerCase() === 'tarea'
            );
             const filteredGoals = tasks.filter(task => 
                task.type && task.type.toLowerCase() === 'meta'
                // O alternativamente si usas typeName:
                // task.typeName && task.typeName.toLowerCase() === 'tarea'
            );
            const wishes = await WishRepository.findAllType(personId, home_id, 'Todas', date);

            const finances = await FinanceRepository.findAllType(personId, home_id, 'Todas', date);

            const personWarehouses = await PersonWareHouseRepository.gettWarehouses(home_id, personId);
            const warehouseIds = personWarehouses.map(item => item.warehouse_id);

            const files = await FileRepository.findAllType(personId, home_id, 2, date);

            const homes = await HomeRepository.findAllHomes(personId);

            const products = await PersonProductRepository.getTotalProductsQuantity({
              home_id: home_id,
              warehouse_ids: warehouseIds, // Array de almacenes
              date: date, // Opcional
            });
            const allSuggestions = await SuggestionRepository.findTodaySuggestions(null, personId, home_id);
            res.status(200).json({
              status: statuses,
              task: filteredTasks.length,
              goals: filteredGoals.length,
              whish: wishes.length,
              finance: finances.length,
              personWarehouses: personWarehouses.length,
              suggestion: allSuggestions.length,
              home: homes.length,
              file: files.length,
              product: products,
            });

        } catch (error) {
            logger.error(`Error en StatusController->findByType: ${error.message}`);
            res.status(500).json({ error: 'ServerError' });
        }
    }
}

module.exports = StatusController;