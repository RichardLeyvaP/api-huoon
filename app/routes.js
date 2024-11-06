const express = require('express');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types'); // Importación compatible con CommonJS
const logger = require('../config/logger');
const router = express.Router();
const passport = require('passport');
const session = require('express-session');

//Middlewares
const auth = require('./middlewares/auth');
const upload = require('./middlewares/multer'); // Middleware de multer
const multerCategory = require('./middlewares/multerCategory');

const AuthController = require('./controllers/AuthController');
const ConfigurationController = require('./controllers/ConfigurationController');
const PersonController = require('./controllers/PersonController');
const StatusController = require('./controllers/StatusController');
const RoleController = require('./controllers/RoleController');
const CategoryController = require('./controllers/CategoryController');
const PriorityController = require('./controllers/PriorityController');
const CategoryPersonController = require('./controllers/CategoryPersonController');
const HomeTypeController = require('./controllers/HomeTypeController');
const HomeController = require('./controllers/HomeController');
const HomePersonController = require('./controllers/HomePersonController');
const TaskController = require('./controllers/TaskController');
const PersonTaskController = require('./controllers/PersonTaskController');
const WarehouseController = require('./controllers/WarehouseController');

router.get('/', (req, res) => res.json({ hello: "World" }));

//Login y register
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Rutas de autenticación
router.get('/login-google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/login-facebook', passport.authenticate('facebook', { scope: ['profile', 'email'] }));
//router.get('/facebook', AuthController.loginWithFacebook);
router.get('/google-callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
      if (err) {
        logger.error('Error en la autenticación de Google:', err);
        return res.status(500).json({ error: 'Error en la autenticación de Google' });
      }
      if (!user) {
        logger.error('Usuario no encontrado en la respuesta de Google:', info);
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      console.log('Datos en la ruta:', user);
      // Llama a tu función en el controlador aquí
      try {
        await AuthController.googleCallback(req, res, user);
      } catch (error) {
        logger.error('Error al llamar a googleCallback:', error);
        return res.status(500).json({ error: 'Error en el procesamiento de la respuesta' });
      }
    })(req, res, next);
});
//router.get('/login-google', AuthController.loginWithGoogle);
router.get('/facebook-callback', (req, res, next) => {
    passport.authenticate('facebook', { session: false }, async (err, user, info) => {
        if (err) {
            logger.error('Error en la autenticación de Facebook:', err);
            return res.status(500).json({ error: 'Error en la autenticación de Facebook' });
        }
        if (!user) {
            logger.error('Usuario no encontrado en la respuesta de Facebook:', info);
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        console.log('Datos en la ruta desde Facebook:', user);

        try {
            // Llama a tu función en el controlador
            await AuthController.facebookCallback(req, res, user);
        } catch (error) {
            logger.error('Error al llamar a facebookCallback:', error);
            return res.status(500).json({ error: 'Error en el procesamiento de la respuesta' });
        }
    })(req, res, next);
});
router.use(auth);

//Ruta Configurations
router.get('/configuration-show', ConfigurationController.show);
router.put('/configuration', ConfigurationController.update);

//Rutas Personas
router.get('/person', PersonController.index);
router.post('/person-show', PersonController.show);
router.post('/person', upload, PersonController.store);
router.post('/person-update', upload, PersonController.update);
router.post('/person-destroy', PersonController.destroy);

//Rutas Statuses
router.get('/status', StatusController.index);
router.post('/status', StatusController.store);
router.post('/status-show', StatusController.show);
router.put('/status', StatusController.update);
router.post('/status-destroy', StatusController.destroy);

//Rutas Roles
router.get('/rol', RoleController.index);
router.post('/rol', RoleController.store);
router.post('/rol-show', RoleController.show);
router.put('/rol', RoleController.update);
router.post('/rol-destroy', RoleController.destroy);

//Rutas Categirias
router.get('/category', CategoryController.index);
router.post('/category', multerCategory('icon', 'categories'), CategoryController.store);
router.post('/category-show', CategoryController.show);
router.post('/category-update', multerCategory('icon', 'categories'), CategoryController.update);
router.post('/category-destroy', CategoryController.destroy);

//Rutas Prioridades
router.get('/priority', PriorityController.index);
router.post('/priority', PriorityController.store);
router.post('/priority-show', PriorityController.show);
router.put('/priority', PriorityController.update);
router.post('/priority-destroy', PriorityController.destroy);

//Rutas CategoryPerson
router.get('/category-person', CategoryPersonController.index);
router.post('/category-person', multerCategory('icon', 'categories'),CategoryPersonController.store);
router.post('/category-person-show', CategoryPersonController.show);
router.post('/category-person-update', multerCategory('icon', 'categories'), CategoryPersonController.update);
router.post('/category-person-destroy', CategoryPersonController.destroy);

//Rutas CategoryPerson
router.get('/home-type', HomeTypeController.index);
router.post('/home-type', HomeTypeController.store);
router.post('/home-type-show', HomeTypeController.show);
router.put('/home-type', HomeTypeController.update);
router.post('/home-type-destroy', HomeTypeController.destroy);

//Rutas Home
router.get('/home', HomeController.index);
router.post('/home', multerCategory('image', 'homes'), HomeController.store);
router.post('/home-show', HomeController.show);
router.post('/home-update', multerCategory('image', 'homes'), HomeController.update);
router.post('/home-destroy', HomeController.destroy);

//Rutas HomePerson
router.get('/home-person', HomePersonController.index);
router.post('/home-person', HomePersonController.store);
router.post('/home-people', HomePersonController.assignPeopleToHome);//Asociar a un hogar un array de [person_id, rol_id]
router.post('/home-person-show', HomePersonController.show);
router.put('/home-person',  HomePersonController.update);
router.post('/home-person-destroy', HomePersonController.destroy);

//Rutas Tareas
router.get('/task', TaskController.index);
router.post('/task-date-apk', TaskController.getTaskDate);
router.post('/task', multerCategory('attachments', 'tasks'), TaskController.store);
router.post('/task-show', TaskController.show);
router.post('/task-update', multerCategory('attachments', 'tasks'), TaskController.update);
router.post('/task-destroy', TaskController.destroy);


//Rutas PersonTask
router.get('/person-task', PersonTaskController.index);
router.post('/person-task', PersonTaskController.store);
router.post('/task-people', PersonTaskController.assignPeopleToTask);//Asociar a un hogar un array de [person_id, rol_id]
router.post('/person-task-show', PersonTaskController.show);
router.put('/person-task',  PersonTaskController.update);
router.post('/person-task-destroy', PersonTaskController.destroy);


//Rutas Almacenes
router.get('/warehouse', WarehouseController.index);
router.post('/warehouse', WarehouseController.store);
router.post('/warehouse-show', WarehouseController.show);
router.put('/warehouse', WarehouseController.update);
router.post('/warehouse-destroy', WarehouseController.destroy);

// Ruta para servir imágenes desde la carpeta `public`
router.get('/images/:foldername/:filename', (req, res) => {
    const { foldername, filename } = req.params;
    const imagePath = path.join(__dirname, '../public', foldername, filename);
    if (!fs.existsSync(imagePath)) {
        return res.status(404).send('Imagen no encontrada');
    }

    // Usa mime-types para obtener el tipo MIME
    const fileType = mime.lookup(imagePath) || 'application/octet-stream';
    fs.readFile(imagePath, (err, file) => {
        if (err) {
            return res.status(500).send('Error al leer la imagen');
        }
        res.writeHead(200, { 'Content-Type': fileType });
        res.end(file);
    });
});

//Rutas Unificadas
router.get('/category-status-priority-apk', TaskController.category_status_priority);


module.exports = router;