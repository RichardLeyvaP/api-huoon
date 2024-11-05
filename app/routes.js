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

router.get('/', (req, res) => res.json({ hello: "World" }));

//Login y register
router.post('/api/login', AuthController.login);
router.post('/api/register', AuthController.register);

// Rutas de autenticación
router.get('/api/login-google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/api/login-facebook', passport.authenticate('facebook', { scope: ['profile', 'email'] }));
//router.get('/api/facebook', AuthController.loginWithFacebook);
router.get('/api/google-callback', (req, res, next) => {
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
//router.get('/api/login-google', AuthController.loginWithGoogle);
router.get('/api/facebook-callback', (req, res, next) => {
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
router.get('/api/configuration-show', ConfigurationController.show);
router.put('/api/configuration', ConfigurationController.update);

//Rutas Personas
router.get('/api/person', PersonController.index);
router.post('/api/person-show', PersonController.show);
router.post('/api/person', upload, PersonController.store);
router.post('/api/person-update', upload, PersonController.update);
router.post('/api/person-destroy', PersonController.destroy);

//Rutas Statuses
router.get('/api/status', StatusController.index);
router.post('/api/status', StatusController.store);
router.post('/api/status-show', StatusController.show);
router.put('/api/status', StatusController.update);
router.post('/api/status-destroy', StatusController.destroy);

//Rutas Roles
router.get('/api/rol', RoleController.index);
router.post('/api/rol', RoleController.store);
router.post('/api/rol-show', RoleController.show);
router.put('/api/rol', RoleController.update);
router.post('/api/rol-destroy', RoleController.destroy);

//Rutas Categirias
router.get('/api/category', CategoryController.index);
router.post('/api/category', multerCategory('icon', 'categories'), CategoryController.store);
router.post('/api/category-show', CategoryController.show);
router.post('/api/category-update', multerCategory('icon', 'categories'), CategoryController.update);
router.post('/api/category-destroy', CategoryController.destroy);

//Rutas Prioridades
router.get('/api/priority', PriorityController.index);
router.post('/api/priority', PriorityController.store);
router.post('/api/priority-show', PriorityController.show);
router.put('/api/priority', PriorityController.update);
router.post('/api/priority-destroy', PriorityController.destroy);

//Rutas CategoryPerson
router.get('/api/category-person', CategoryPersonController.index);
router.post('/api/category-person', multerCategory('icon', 'categories'),CategoryPersonController.store);
router.post('/api/category-person-show', CategoryPersonController.show);
router.post('/api/category-person-update', multerCategory('icon', 'categories'), CategoryPersonController.update);
router.post('/api/category-person-destroy', CategoryPersonController.destroy);

//Rutas CategoryPerson
router.get('/api/home-type', HomeTypeController.index);
router.post('/api/home-type', HomeTypeController.store);
router.post('/api/home-type-show', HomeTypeController.show);
router.put('/api/home-type', HomeTypeController.update);
router.post('/api/home-type-destroy', HomeTypeController.destroy);

//Rutas Home
router.get('/api/home', HomeController.index);
router.post('/api/home', multerCategory('image', 'homes'), HomeController.store);
router.post('/api/home-show', HomeController.show);
router.post('/api/home-update', multerCategory('image', 'homes'), HomeController.update);
router.post('/api/home-destroy', HomeController.destroy);

//Rutas HomePerson
router.get('/api/home-person', HomePersonController.index);
router.post('/api/home-person', HomePersonController.store);
router.post('/api/home-people', HomePersonController.assignPeopleToHome);//Asociar a un hogar un array de [person_id, rol_id]
router.post('/api/home-person-show', HomePersonController.show);
router.put('/api/home-person',  HomePersonController.update);
router.post('/api/home-person-destroy', HomePersonController.destroy);

//Rutas Tareas
router.get('/api/task', TaskController.index);
router.post('/api/task-date-apk', TaskController.getTaskDate);
router.post('/api/task', multerCategory('attachments', 'tasks'), TaskController.store);
router.post('/api/task-show', TaskController.show);
router.post('/api/task-update', multerCategory('attachments', 'tasks'), TaskController.update);
router.post('/api/task-destroy', TaskController.destroy);

//Rutas PersonTask
router.get('/api/person-task', PersonTaskController.index);
router.post('/api/person-task', PersonTaskController.store);
router.post('/api/task-people', PersonTaskController.assignPeopleToTask);//Asociar a un hogar un array de [person_id, rol_id]
router.post('/api/person-task-show', PersonTaskController.show);
router.put('/api/person-task',  PersonTaskController.update);
router.post('/api/person-task-destroy', PersonTaskController.destroy);

// Ruta para servir imágenes desde la carpeta `public`
router.get('/api/images/:foldername/:filename', (req, res) => {
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
router.get('/api/category-status-priority-apk', TaskController.category_status_priority);


module.exports = router;