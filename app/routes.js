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
const validateSchema = require('./middlewares/validateSchema');
const { storeCategorySchema, updateCategorySchema, idCategorySchema } = require('./middlewares/validations/categoryValidation');
const { registerSchema, loginSchema, updatePasswordSchema } = require('./middlewares/validations/authValidation');
const { storeHomeSchema, updateHomeSchema, idHomeSchema } = require('./middlewares/validations/homeValidation');
const { storeHomeTypeSchema, updateHomeTypeSchema, idHomeTypeSchema } = require('./middlewares/validations/homeTypeValidation');
const { storePrioritySchema, updatePrioritySchema, idPrioritySchema } = require('./middlewares/validations/priorityValidation');
const { storeRoleSchema, updateRoleSchema, idRoleSchema } = require('./middlewares/validations/roleValidation');
const { storeStatusSchema, updateStatusSchema, idStatusSchema } = require('./middlewares/validations/statusValidation');
const { storeHomePersonSchema, updateHomePersonSchema, idHomePersonSchema, assignPeopleSchema } = require('./middlewares/validations/homePersonValidation');
const { storeWareHouseSchema, updateWareHouseSchema, idWareHouseSchema } = require('./middlewares/validations/warehouseValidation');
const { storePersonWareHouseSchema, updatePersonWareHouseSchema, idPersonWareHouseSchema, getWarehouseSchema } = require('./middlewares/validations/personWareHouseValidation');
const { storePersonSchema, updatePersonSchema, idPersonSchema } = require('./middlewares/validations/personValidation');

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
const WarehouseController = require('./controllers/WarehouseController');
const HomeWareHouseController = require('./controllers/HomeWareHouseController');
const PersonWareHouseController = require('./controllers/PersonWareHouseController');
const ProductController = require('./controllers/ProductController');
const HomeWarehouseProductController = require('./controllers/HomeWarehouseProductController');
const PersonHomeWarehouseProductController = require('./controllers/PersonHomeWarehouseProductController');
const HomePersonTaskController = require('./controllers/HomePersonTaskController');

router.get('/', (req, res) => res.json({ hello: "World" }));

//Login y register
router.post('/login', validateSchema(loginSchema), AuthController.login);
router.post('/login-apk', validateSchema(loginSchema), AuthController.loginApk);
router.post('/register', validateSchema(registerSchema), AuthController.register);

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

router.use(auth);

router.get('/logout', AuthController.logout);
router.post('/update-password', validateSchema(updatePasswordSchema), AuthController.updatePassword);

//Ruta Configurations
router.get('/configuration-show', ConfigurationController.show);
router.put('/configuration', ConfigurationController.update);

//Rutas Personas
router.get('/person', PersonController.index);
router.post('/person-show', validateSchema(idPersonSchema), PersonController.show);
router.post('/person', validateSchema(storePersonSchema), multerCategory('image', 'people'), PersonController.store);
router.post('/person-update', validateSchema(updatePersonSchema), multerCategory('image', 'people'), PersonController.update);
router.post('/person-destroy', validateSchema(idPersonSchema), PersonController.destroy);

//Rutas Statuses
router.get('/status', StatusController.index);
router.post('/status', validateSchema(storeStatusSchema), StatusController.store);
router.post('/status-show', validateSchema(idStatusSchema), StatusController.show);
router.put('/status', validateSchema(updateStatusSchema), StatusController.update);
router.post('/status-destroy', validateSchema(idStatusSchema), StatusController.destroy);

//Rutas Roles
router.get('/rol', RoleController.index);
router.post('/rol', validateSchema(storeRoleSchema), RoleController.store);
router.post('/rol-show', validateSchema(idRoleSchema), RoleController.show);
router.put('/rol', validateSchema(updateRoleSchema), RoleController.update);
router.post('/rol-destroy', validateSchema(idRoleSchema), RoleController.destroy);

//Rutas Categirias
router.get('/category', CategoryController.index);
router.post('/category', validateSchema(storeCategorySchema), multerCategory('icon', 'categories'), CategoryController.store);
router.post('/category-show', validateSchema(idCategorySchema), CategoryController.show);
router.post('/category-update', validateSchema(updateCategorySchema), multerCategory('icon', 'categories'), CategoryController.update);
router.post('/category-destroy', validateSchema(idCategorySchema), CategoryController.destroy);

//Rutas Prioridades
router.get('/priority', PriorityController.index);
router.post('/priority', validateSchema(storePrioritySchema), PriorityController.store);
router.post('/priority-show', validateSchema(idPrioritySchema), PriorityController.show);
router.put('/priority', validateSchema(updatePrioritySchema), PriorityController.update);
router.post('/priority-destroy', validateSchema(idPrioritySchema), PriorityController.destroy);

//Rutas CategoryPerson
router.get('/category-person', CategoryPersonController.index);
router.post('/category-person', validateSchema(storeCategorySchema), multerCategory('icon', 'categories'),CategoryPersonController.store);
router.post('/category-person-show', validateSchema(idCategorySchema), CategoryPersonController.show);
router.post('/category-person-update', validateSchema(updateCategorySchema), multerCategory('icon', 'categories'), CategoryPersonController.update);
router.post('/category-person-destroy', validateSchema(idCategorySchema), CategoryPersonController.destroy);

//Rutas CategoryPerson
router.get('/home-type', HomeTypeController.index);
router.post('/home-type', validateSchema(storeHomeTypeSchema), HomeTypeController.store);
router.post('/home-type-show', validateSchema(idHomeTypeSchema), HomeTypeController.show);
router.put('/home-type', validateSchema(updateHomeTypeSchema), HomeTypeController.update);
router.post('/home-type-destroy', validateSchema(idHomeTypeSchema), HomeTypeController.destroy);

//Rutas Home
router.get('/home', HomeController.index);
router.post('/home', validateSchema(storeHomeSchema), multerCategory('image', 'homes'), HomeController.store);
router.post('/home-show', validateSchema(idHomeSchema), HomeController.show);
router.post('/home-update', validateSchema(updateHomeSchema), multerCategory('image', 'homes'), HomeController.update);
router.post('/home-destroy', validateSchema(idHomeSchema), HomeController.destroy);

//Rutas HomePerson
router.get('/home-person', HomePersonController.index);
router.post('/home-person', validateSchema(storeHomePersonSchema), HomePersonController.store);
router.post('/home-people', validateSchema(assignPeopleSchema), HomePersonController.assignPeopleToHome);//Asociar a un hogar un array de [person_id, rol_id]
router.post('/home-person-show', validateSchema(idHomePersonSchema), HomePersonController.show);
router.put('/home-person',  validateSchema(updateHomePersonSchema), HomePersonController.update);
router.post('/home-person-destroy', validateSchema(idHomePersonSchema), HomePersonController.destroy);

//Rutas Tareas
router.get('/task', TaskController.index);
router.post('/task-date-apk', TaskController.getTaskDate);
router.post('/task', multerCategory('attachments', 'tasks'), TaskController.store);
router.post('/task-show', TaskController.show);
router.post('/task-update', multerCategory('attachments', 'tasks'), TaskController.update);
router.post('/task-destroy', TaskController.destroy);


//Rutas PersonTask
router.get('/home-person-task', HomePersonTaskController.index);
router.post('/home-person-task', HomePersonTaskController.store);
router.post('/task-people-home', HomePersonTaskController.assignPeopleToTask);//Asociar a un hogar un array de [person_id, rol_id]
router.post('/home-person-task-show', HomePersonTaskController.show);
router.put('/home-person-task',  HomePersonTaskController.update);
router.post('/home-person-task-destroy', HomePersonTaskController.destroy);


//Rutas Almacenes
router.get('/warehouse', WarehouseController.index);
router.post('/warehouse', validateSchema(storeWareHouseSchema), WarehouseController.store);
router.post('/warehouse-show', validateSchema(idWareHouseSchema), WarehouseController.show);
router.put('/warehouse', validateSchema(updateWareHouseSchema), WarehouseController.update);
router.post('/warehouse-destroy', validateSchema(idWareHouseSchema), WarehouseController.destroy);
router.post('/get-warehouse', WarehouseController.getWarehouses);//devolver los alamcenes predeterminados 

//Rutas Almacenes
router.get('/home-warehouse', HomeWareHouseController.index);
router.post('/home-warehouse', HomeWareHouseController.store);
router.post('/home-warehouse-show', HomeWareHouseController.show);
router.put('/home-warehouse', HomeWareHouseController.update);
router.post('/home-warehouse-destroy', HomeWareHouseController.destroy);

//Rutas Almacenes
router.get('/person-warehouse', PersonWareHouseController.index);
router.post('/person-warehouse', validateSchema(storePersonWareHouseSchema), PersonWareHouseController.store);
router.post('/person-warehouse-show', validateSchema(idPersonWareHouseSchema), PersonWareHouseController.show);
router.put('/person-warehouse', validateSchema(updatePersonWareHouseSchema), PersonWareHouseController.update);
router.post('/person-warehouse-destroy', validateSchema(idPersonWareHouseSchema), PersonWareHouseController.destroy);
router.post('/person-warehouse-home', validateSchema(getWarehouseSchema), PersonWareHouseController.getWarehouses); //devolver los almaces de una persona en un hogar dado

//Rutas Productos
router.get('/product', ProductController.index);
router.post('/product', multerCategory('image', 'products'), ProductController.store);
router.post('/product-show', ProductController.show);
router.post('/product-update', multerCategory('image', 'products'), ProductController.update);
router.post('/product-destroy', ProductController.destroy);

//Rutas Productos en almacenes del hogar
router.get('/home-warehouse-product', HomeWarehouseProductController.index);
router.post('/home-warehouse-product', multerCategory('image', 'homeWarehoseProducts'), HomeWarehouseProductController.store);
router.post('/home-warehouse-product-show', HomeWarehouseProductController.show);
router.post('/home-warehouse-products', HomeWarehouseProductController.homeWarehouseProducts);//Devolver los productos de un almacén en un hogar
router.post('/home-warehouse-product-update', multerCategory('image', 'homeWarehoseProducts'), HomeWarehouseProductController.update);
router.post('/home-warehouse-product-destroy', HomeWarehouseProductController.destroy);

//Rutas Productos en almacenes de la persona en el hogar
router.get('/person-home-warehouse-product', PersonHomeWarehouseProductController.index);
router.post('/person-home-warehouse-product', multerCategory('image', 'personHomeWarehouseProducts'), PersonHomeWarehouseProductController.store);
router.post('/person-home-warehouse-product-show', PersonHomeWarehouseProductController.show);
router.post('/person-home-warehouse-products', PersonHomeWarehouseProductController.personHomeWarehouseProducts);//Devolver los productos de un almacén en un hogar
router.post('/person-home-warehouse-product-update', multerCategory('image', 'personHomeWarehouseProducts'), PersonHomeWarehouseProductController.update);
router.post('/person-home-warehouse-product-destroy', PersonHomeWarehouseProductController.destroy);


//Rutas Unificadas
router.get('/productcategory-productstatus-apk', ProductController.category_status);
router.post('/category-status-priority-apk', TaskController.category_status_priority);
router.get('/hometype-status-people-apk', HomeController.homeType_status_people);


module.exports = router;