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
const multerMultiple = require('./middlewares/multerMultiple'); // Middleware de multer
const multerCategory = require('./middlewares/multerCategory');
const validateSchema = require('./middlewares/validateSchema');
const { storeCategorySchema, updateCategorySchema, idCategorySchema } = require('./middlewares/validations/categoryValidation');
const { registerSchema, loginSchema, updatePasswordSchema, googgleApkSchema } = require('./middlewares/validations/authValidation');
const { storeHomeSchema, updateHomeSchema, idHomeSchema } = require('./middlewares/validations/homeValidation');
const { storeHomeTypeSchema, updateHomeTypeSchema, idHomeTypeSchema } = require('./middlewares/validations/homeTypeValidation');
const { storePrioritySchema, updatePrioritySchema, idPrioritySchema } = require('./middlewares/validations/priorityValidation');
const { storeRoleSchema, updateRoleSchema, idRoleSchema } = require('./middlewares/validations/roleValidation');
const { storeStatusSchema, updateStatusSchema, idStatusSchema, typeStatusSchema } = require('./middlewares/validations/statusValidation');
const { storeHomePersonSchema, updateHomePersonSchema, idHomePersonSchema, assignPeopleSchema } = require('./middlewares/validations/homePersonValidation');
const { storeWareHouseSchema, updateWareHouseSchema, idWareHouseSchema } = require('./middlewares/validations/warehouseValidation');
const { storePersonWareHouseSchema, updatePersonWareHouseSchema, idPersonWareHouseSchema, getWarehouseSchema } = require('./middlewares/validations/personWareHouseValidation');
const { storePersonSchema, updatePersonSchema, idPersonSchema } = require('./middlewares/validations/personValidation');
const { storeHomePersonTaskSchema, updateHomePersonTaskSchema, idHomePersonTaskSchema, assignPeopleTaskSchema } = require('./middlewares/validations/homePersonTaskValidation');
const { storeTaskSchema, updateTaskSchema, idTaskSchema, getDateTaskSchema, home_idTaskSchema, updatePointsAndTasksSchema } = require('./middlewares/validations/taskValidation');
const { storePersonProductSchema, updatePersonProductSchema, idPersonProductSchema, getPersonHomeProductSchema, ocrStringSchema } = require('./middlewares/validations/personwarehouseproductValidation');
const { storeProductSchema, updateProductSchema, idProductSchema } = require('./middlewares/validations/productValidation');
const { storeFinanceSchema, updateFinanceSchema, idFinanceSchema, getFinanceSchema } = require('./middlewares/validations/financeValidation');
const { storeFileSchema, updateFileSchema, idFileSchema, typeFileSchema } = require('./middlewares/validations/fileValidation');
const { getNotificationsSchema } = require('./middlewares/validations/notificationValidation');
const { storeWishSchema, updateWishSchema, idWishSchema, getWishSchema } = require('./middlewares/validations/wishValidation');
const { storeMedicalHistorySchema, updateMedicalHistorySchema, idMedicalHistorySchema, getMedicalHistorySchema } = require('./middlewares/validations/medicalhistoryValidation');
const { storeMedicalConsultationSchema, updateMedicalConsultationSchema, idMedicalConsultationSchema, getMedicalConsultationSchema} = require("./middlewares/validations/medicalconsultationValidation");
const { storeTypeSchema, updateTypeSchema, idTypeSchema, typeSchema} = require("./middlewares/validations/typeValidation");
const { storeMedicalExamSchema, updateMedicalExamSchema, idMedicalExamSchema, getMedicalExamSchema} = require("./middlewares/validations/medicalexamValidation");
const { storeEmergencySchema, updateEmergencySchema, idEmergencySchema, getEmergencySchema,} = require("./middlewares/validations/emergencyValidation");
const { storePersonalBackgroundSchema, updatePersonalBackgroundSchema, idPersonalBackgroundSchema, getPersonalBackgroundSchema } = require('./middlewares/validations/personalBackgroundValidation');
const { storeFamilyBackgroundSchema, updateFamilyBackgroundSchema, idFamilyBackgroundSchema, getFamilyBackgroundSchema } = require('./middlewares/validations/familyBackgroundValidation');
const {  storePhysicalExamSchema, updatePhysicalExamSchema, idPhysicalExamSchema, getPhysicalExamSchema } = require('./middlewares/validations/physicalExamValidation');
const { storePsychosocialBackgroundSchema, updatePsychosocialBackgroundSchema, idPsychosocialBackgroundSchema, getPsychosocialBackgroundSchema } = require('./middlewares/validations/psychosocialBackgroundValidation');
const { storeDiagnosisSchema, updateDiagnosisSchema, idDiagnosisSchema, getDiagnosisSchema } = require('./middlewares/validations/diagnosisValidation');
const { storeTreatmentSchema, updateTreatmentSchema, idTreatmentSchema, getTreatmentSchema } = require('./middlewares/validations/treatmentValidation');
const { storeSuggestionSchema, updateSuggestionSchema, idSuggestionSchema, getSuggestionSchema } = require('./middlewares/validations/suggestionValidation');
const { storeBudgetSchema, updateBudgetSchema, idBudgetSchema, getBudgetsSchema } = require('./middlewares/validations/budgetValidation');

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
const OpenAIController = require('./controllers/OpenAIController');
const FinanceController = require('./controllers/FinanceController');
const NotificationController = require('./controllers/NotificationController');
const FileController = require('./controllers/FileController');
const WishController = require('./controllers/WishController');
const MedicalHistoryController = require('./controllers/MedicalHistoryController');
const MedicalConsultationController = require('./controllers/MedicalConsultationController');
const TypeController = require('./controllers/TypeController');
const MedicalExamController = require('./controllers/MedicalExamController');
const EmergencyController = require('./controllers/EmergencyController');
const PersonalBackgroundController = require('./controllers/PersonalBackgroundController');
const FamilyBackgroundController = require('./controllers/FamilyBackgroundController');
const PhysicalExamController = require('./controllers/PhysicalExamController');
const PsychosocialBackgroundController = require('./controllers/PsychosocialBackgroundController');
const DiagnosisController = require('./controllers/DiagnosisController');
const TreatmentController = require('./controllers/TreatmentController');
const SuggestionController = require('./controllers/SuggestionController');
const BudgetController = require('./controllers/BudgetController');

router.get('/', (req, res) => res.json({ hello: "World" }));

//Login y register
router.post('/login', validateSchema(loginSchema), AuthController.login);
router.post('/login-apk', validateSchema(loginSchema), AuthController.loginApk);
router.post('/register', validateSchema(registerSchema), AuthController.register);
router.post('/send-notification', NotificationController.sendNotification)

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
      //console.log('Datos en la ruta:', user);
      // Llama a tu función en el controlador aquí
      try {
        await AuthController.googleCallback(req, res, user);
      } catch (error) {
        logger.error('Error al llamar a googleCallback:', error);
        return res.status(500).json({ error: 'Error en el procesamiento de la respuesta' });
      }
    })(req, res, next);
});

router.post('/google-callback-apk', validateSchema(googgleApkSchema), AuthController.googleCallbackAPK)
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
        //console.log('Datos en la ruta desde Facebook:', user);

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

    // Verifica si el archivo existe
    if (!fs.existsSync(imagePath)) {
        return res.status(404).send('Imagen no encontrada');
    }

    // Obtén el tipo MIME del archivo
    const fileType = mime.lookup(imagePath) || 'application/octet-stream';

    // Lee el archivo y envíalo en la respuesta
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
router.post('/ask-ai', OpenAIController.getAIResponse);
router.post('/ask-ai-task', OpenAIController.getAITask);
router.post('/ask-ai-module', OpenAIController.AiInteraction);

//Ruta Configurations
router.get('/configuration-show', ConfigurationController.show);
router.put('/configuration', ConfigurationController.update);

//Rutas Personas
router.get('/person', PersonController.index);
router.get('/person-profile', PersonController.getPersonProfile);
router.post('/person-show', validateSchema(idPersonSchema), PersonController.show);
router.post('/person', validateSchema(storePersonSchema), multerCategory('image', 'people'), PersonController.store);
router.post('/person-update', multerCategory('image', 'people'), validateSchema(updatePersonSchema), PersonController.update);
router.post('/person-destroy', validateSchema(idPersonSchema), PersonController.destroy);

//Rutas Statuses
router.get('/status', StatusController.index);
router.post('/status', validateSchema(storeStatusSchema), StatusController.store);
router.post('/status-show', validateSchema(idStatusSchema), StatusController.show);
router.put('/status', validateSchema(updateStatusSchema), StatusController.update);
router.post('/status-destroy', validateSchema(idStatusSchema), StatusController.destroy);
router.post('/status-by-type', validateSchema(typeStatusSchema), StatusController.findByType);//okks

// Rutas para antecedentes personales
router.get('/personal-background', PersonalBackgroundController.index);
router.post('/get-background-person', PersonalBackgroundController.getByPersonId);
router.post('/get-background-type', PersonalBackgroundController.getByType); // Nueva ruta para filtrar por tipo
router.post('/get-active-backgrounds', PersonalBackgroundController.getActive); // Nueva ruta para antecedentes activos
router.post('/personal-background', validateSchema(storePersonalBackgroundSchema), PersonalBackgroundController.store);
router.post('/personal-background-show', validateSchema(idPersonalBackgroundSchema), PersonalBackgroundController.show);
router.post('/personal-background-update', validateSchema(updatePersonalBackgroundSchema), PersonalBackgroundController.update);
router.post('/personal-background-destroy', validateSchema(idPersonalBackgroundSchema), PersonalBackgroundController.destroy);

// Rutas para antecedentes familiares
router.get('/family-background', FamilyBackgroundController.index);
router.post('/get-family-background-person', FamilyBackgroundController.getByPersonId);
router.post('/get-family-background-type', FamilyBackgroundController.getByType);
router.post('/get-family-background-relationship', FamilyBackgroundController.getByRelationship);
router.post('/get-family-background-disease', FamilyBackgroundController.getByDisease);
router.post('/family-background', validateSchema(storeFamilyBackgroundSchema), FamilyBackgroundController.store);
router.post('/family-background-show', FamilyBackgroundController.show);
router.post('/family-background-update', validateSchema(updateFamilyBackgroundSchema), FamilyBackgroundController.update);
router.post('/family-background-destroy', validateSchema(idFamilyBackgroundSchema), FamilyBackgroundController.destroy);

// Exámenes físicos
router.get('/physical-exams', PhysicalExamController.index);
router.post('/physical-exams-person', PhysicalExamController.getByPersonId);
router.post('/physical-exams', validateSchema(storePhysicalExamSchema), PhysicalExamController.store);
router.post('/physical-exams-show', validateSchema(idPhysicalExamSchema), PhysicalExamController.show);
router.post('/physical-exams-update', validateSchema(updatePhysicalExamSchema), PhysicalExamController.update);
router.post('/physical-exams-delete', validateSchema(idPhysicalExamSchema), PhysicalExamController.destroy);

// Psychosocial Background Routes
router.get('/psychosocial-backgrounds', PsychosocialBackgroundController.index);
router.get('/psychosocial-backgrounds-person', PsychosocialBackgroundController.getByPersonId);
router.post('/psychosocial-background', validateSchema(storePsychosocialBackgroundSchema), PsychosocialBackgroundController.store);
router.post('/psychosocial-background-show', validateSchema(idPsychosocialBackgroundSchema), PsychosocialBackgroundController.show);
router.post('/psychosocial-background-update', validateSchema(updatePsychosocialBackgroundSchema), PsychosocialBackgroundController.update);
router.post('/psychosocial-background-delete', validateSchema(idPsychosocialBackgroundSchema), PsychosocialBackgroundController.destroy);

// Diagnosis Routes
router.get('/diagnoses', DiagnosisController.index);
router.post('/diagnoses-person', DiagnosisController.getByPersonId);
router.post('/diagnosis', validateSchema(storeDiagnosisSchema), DiagnosisController.store);
router.post('/diagnosis-show', validateSchema(idDiagnosisSchema), DiagnosisController.show);
router.post('/diagnosis-update', validateSchema(updateDiagnosisSchema), DiagnosisController.update);
router.post('/diagnosis-delete', validateSchema(idDiagnosisSchema), DiagnosisController.destroy);

// Treatment Routes
router.get('/treatments', TreatmentController.index);
router.post('/treatments-person', TreatmentController.getByPersonId);
router.get('/active-treatments', TreatmentController.getActiveTreatments);
router.post('/treatment', validateSchema(storeTreatmentSchema), TreatmentController.store);
router.post('/treatment-show', validateSchema(idTreatmentSchema), TreatmentController.show);
router.post('/treatment-update', validateSchema(updateTreatmentSchema), TreatmentController.update);
router.post('/treatment-delete', validateSchema(idTreatmentSchema), TreatmentController.destroy);

// Rutas para sugerencias
router.get('/suggestion', SuggestionController.index);
router.post('/get-suggestion-person', SuggestionController.getByPersonId);
router.post('/suggestion', validateSchema(storeSuggestionSchema), SuggestionController.store);
router.post('/suggestion-show', validateSchema(idSuggestionSchema), SuggestionController.show);
router.post('/suggestion-update', validateSchema(updateSuggestionSchema), SuggestionController.update);
router.post('/suggestion-destroy', validateSchema(idSuggestionSchema), SuggestionController.destroy);

// Rutas CRUD básicas para presupuestos
router.get('/budget', BudgetController.index); // Obtener todos los presupuestos
router.post('/get-budget-person', BudgetController.getByPersonId);
router.post('/budget', validateSchema(storeBudgetSchema), BudgetController.store); // Crear nuevo presupuesto
router.post('/budget-show', validateSchema(idBudgetSchema),BudgetController.show); // Obtener un presupuesto específico
router.post('/budget-update', validateSchema(updateBudgetSchema), BudgetController.update); // Actualizar presupuesto
router.delete('/budget', validateSchema(idBudgetSchema), BudgetController.destroy); // Eliminar presupuesto

// Ruta para obtener presupuestos por persona
router.post('/budget-by-person', validateSchema(getBudgetsSchema), BudgetController.getByPersonId);

//Rutas Roles
router.get('/role', RoleController.index);
router.post('/role', validateSchema(storeRoleSchema), RoleController.store);
router.post('/role-show', validateSchema(idRoleSchema), RoleController.show);
router.put('/role', validateSchema(updateRoleSchema), RoleController.update);
router.post('/role-destroy', validateSchema(idRoleSchema), RoleController.destroy);

//Rutas Categirias
router.get('/category', CategoryController.index);
router.post('/category', multerCategory('icon', 'categories'), validateSchema(storeCategorySchema), CategoryController.store);
router.post('/category-show', validateSchema(idCategorySchema), CategoryController.show);
router.post('/category-update', multerCategory('icon', 'categories'), validateSchema(updateCategorySchema), CategoryController.update);
router.post('/category-destroy', validateSchema(idCategorySchema), CategoryController.destroy);

//Rutas Prioridades
router.get('/priority', PriorityController.index);
router.post('/priority', validateSchema(storePrioritySchema), PriorityController.store);
router.post('/priority-show', validateSchema(idPrioritySchema), PriorityController.show);
router.put('/priority', validateSchema(updatePrioritySchema), PriorityController.update);
router.post('/priority-destroy', validateSchema(idPrioritySchema), PriorityController.destroy);

//Rutas CategoryPerson
router.get('/category-person', CategoryPersonController.index);
router.post('/category-person', multerCategory('icon', 'categories'), validateSchema(storeCategorySchema),CategoryPersonController.store);
router.post('/category-person-show', validateSchema(idCategorySchema), CategoryPersonController.show);
router.post('/category-person-update', multerCategory('icon', 'categories'), validateSchema(updateCategorySchema),CategoryPersonController.update);
router.post('/category-person-destroy', validateSchema(idCategorySchema), CategoryPersonController.destroy);

//Rutas CategoryPerson
router.get('/home-type', HomeTypeController.index);
router.post('/home-type', validateSchema(storeHomeTypeSchema), HomeTypeController.store);
router.post('/home-type-show', validateSchema(idHomeTypeSchema), HomeTypeController.show);
router.put('/home-type', validateSchema(updateHomeTypeSchema), HomeTypeController.update);
router.post('/home-type-destroy', validateSchema(idHomeTypeSchema), HomeTypeController.destroy);

//Rutas Home
router.get('/home', HomeController.index);
router.post('/person-homes', HomeController.getHomes);
router.post('/home-verify-code', HomeController.verifyCode);
router.post('/home', multerCategory('image', 'homes'), validateSchema(storeHomeSchema), HomeController.store);
router.post('/home-show', validateSchema(idHomeSchema), HomeController.show);
router.post('/home-update', multerCategory('image', 'homes'), validateSchema(updateHomeSchema), HomeController.update);
router.post('/home-destroy', validateSchema(idHomeSchema), HomeController.destroy);

//Rutas HomePerson
router.get('/home-person', HomePersonController.index);
router.post('/get-home-persons', validateSchema(getWarehouseSchema), HomePersonController.index_home);
router.post('/home-person', validateSchema(storeHomePersonSchema), HomePersonController.store);
router.post('/home-people', validateSchema(assignPeopleSchema), HomePersonController.assignPeopleToHome);//Asociar a un hogar un array de [person_id, rol_id]
router.post('/home-person-show', validateSchema(idHomePersonSchema), HomePersonController.show);
router.put('/home-person',  validateSchema(updateHomePersonSchema), HomePersonController.update);
router.post('/home-person-destroy', validateSchema(idHomePersonSchema), HomePersonController.destroy);

//Rutas Tareas
router.get('/task', TaskController.index);
router.post('/task-date-apk',  validateSchema(getDateTaskSchema), TaskController.getTaskDate);
router.post('/task-date-web',  validateSchema(getDateTaskSchema), TaskController.getTaskDateWeb);
router.post('/task', multerCategory('attachments', 'tasks'), validateSchema(storeTaskSchema),TaskController.store);
router.post('/task-bulk',TaskController.storeBulk);//okk
router.post('/task-chat-suggestion',TaskController.generateSuggestion);
router.post('/task-show', validateSchema(idTaskSchema), TaskController.show);
router.post('/task-update', multerCategory('attachments', 'tasks'), validateSchema(updateTaskSchema), TaskController.update);
router.post('/task-create-points', validateSchema(updatePointsAndTasksSchema), TaskController.createPointsAndTasks);
router.post('/task-update-points', validateSchema(updatePointsAndTasksSchema), TaskController.updatePointsAndTasks);
router.post('/task-destroy', validateSchema(idTaskSchema), TaskController.destroy);


//Rutas PersonTask
router.get('/home-person-task', HomePersonTaskController.index);
router.post('/home-person-task', validateSchema(storeHomePersonTaskSchema), HomePersonTaskController.store);
router.post('/task-people-home', validateSchema(assignPeopleTaskSchema), HomePersonTaskController.assignPeopleToTask);//Asociar a un hogar un array de [person_id, rol_id]
router.post('/home-person-task-show', validateSchema(idHomePersonTaskSchema), HomePersonTaskController.show);
router.put('/home-person-task',  validateSchema(updateHomePersonTaskSchema), HomePersonTaskController.update);
router.post('/home-person-task-destroy', validateSchema(idHomePersonTaskSchema), HomePersonTaskController.destroy);


//Rutas Almacenes
router.get('/warehouse', WarehouseController.index);
router.post('/warehouse', validateSchema(storeWareHouseSchema), WarehouseController.store);
router.post('/warehouse-show', validateSchema(idWareHouseSchema), WarehouseController.show);
router.put('/warehouse', validateSchema(updateWareHouseSchema), WarehouseController.update);
router.post('/warehouse-destroy', validateSchema(idWareHouseSchema), WarehouseController.destroy);
router.post('/get-warehouse', WarehouseController.getWarehouses);//devolver los alamcenes predeterminados y asociados a la persona

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
router.post('/person-warehouse-home-select', validateSchema(getWarehouseSchema), PersonWareHouseController.selectWarehouses); //devolver los almaces de una persona en un hogar dado

//Rutas Productos
router.get('/product', ProductController.index);
router.post('/product', multerCategory('image', 'products'), validateSchema(storeProductSchema), ProductController.store);
router.post('/product-show', validateSchema(idProductSchema), ProductController.show);
router.post('/product-update', multerCategory('image', 'products'), validateSchema(updateProductSchema), ProductController.update);
router.post('/product-destroy', validateSchema(idProductSchema), ProductController.destroy);

//Rutas Productos en almacenes del hogar
router.get('/home-warehouse-product', HomeWarehouseProductController.index);
router.post('/home-warehouse-product', multerCategory('image', 'homeWarehoseProducts'), HomeWarehouseProductController.store);
router.post('/home-warehouse-product-show', HomeWarehouseProductController.show);
router.post('/home-warehouse-products', HomeWarehouseProductController.homeWarehouseProducts);//Devolver los productos de un almacén en un hogar
router.post('/home-warehouse-product-update', multerCategory('image', 'homeWarehoseProducts'), HomeWarehouseProductController.update);
router.post('/home-warehouse-product-destroy', HomeWarehouseProductController.destroy);

//Rutas Productos en almacenes de la persona en el hogar
router.get('/person-home-warehouse-product', PersonHomeWarehouseProductController.index);
router.post('/person-home-warehouse-product', multerCategory('image', 'personProducts'), validateSchema(storePersonProductSchema), PersonHomeWarehouseProductController.store);
router.post('/person-home-warehouse-product-show', validateSchema(idPersonProductSchema), PersonHomeWarehouseProductController.show);
router.post('/person-home-warehouse-products', validateSchema(getPersonHomeProductSchema), PersonHomeWarehouseProductController.personHomeWarehouseProducts);//Devolver los productos de un almacén en un hogar
router.post('/person-home-warehouse-product-update', multerCategory('image', 'personProducts'), validateSchema(updatePersonProductSchema), PersonHomeWarehouseProductController.update);
router.post('/person-home-warehouse-product-destroy', validateSchema(idPersonProductSchema), PersonHomeWarehouseProductController.destroy);
router.post("/process-ocr", validateSchema(ocrStringSchema), PersonHomeWarehouseProductController.processOCR);

//Rutas Finanzas
router.get('/finance', FinanceController.index);
router.post('/get-type-finance', validateSchema(getFinanceSchema), FinanceController.getTypeFinances);
router.post('/get-type-finance-range', validateSchema(getFinanceSchema), FinanceController.getTypeFinancesRange);
router.post('/finance', multerCategory('image', 'finances'), validateSchema(storeFinanceSchema), FinanceController.store);
router.post('/finance-show', validateSchema(idFinanceSchema), FinanceController.show);
router.post('/finance-update', multerCategory('image', 'finances'), validateSchema(updateFinanceSchema), FinanceController.update);
router.post('/finance-destroy', validateSchema(idFinanceSchema), FinanceController.destroy);
router.post('/finance-statistics-month',  FinanceController.getPersonFinancialStats);
router.post('/get-finances-data',  FinanceController.getFinacesData);

//Rutas Files
router.get('/file', FileController.index);
router.post('/get-type-files', validateSchema(typeFileSchema), FileController.getTypeFiles);
router.post('/file', multerCategory('archive', 'files'), validateSchema(storeFileSchema), FileController.store);
router.post('/file-show', validateSchema(idFileSchema), FileController.show);
router.post('/file-update', multerCategory('archive', 'files'), validateSchema(updateFileSchema), FileController.update);
router.post('/file-destroy', validateSchema(idFileSchema), FileController.destroy);

//Ruta Notificaciones
router.post('/get-user-notifications', validateSchema(getNotificationsSchema), NotificationController.getUserNotifications);

//Rutas Deseos
router.get('/wish', WishController.index);
router.post('/get-type-wishes', validateSchema(getWishSchema), WishController.getTypeWishes);
router.post('/wish', validateSchema(storeWishSchema), WishController.store);
router.post('/wish-show', validateSchema(idWishSchema), WishController.show);
router.put('/wish', validateSchema(updateWishSchema), WishController.update);
router.post('/wish-destroy', validateSchema(idWishSchema), WishController.destroy);

//Rutas Historias médicas
router.get('/history-medical', MedicalHistoryController.index);
router.post('/get-medical-histories',  MedicalHistoryController.getByPersonId);
router.post('/history-medical', validateSchema(storeMedicalHistorySchema), MedicalHistoryController.store);
router.post('/history-medical-show', validateSchema(idMedicalHistorySchema), MedicalHistoryController.show);
router.put('/history-medical', validateSchema(updateMedicalHistorySchema), MedicalHistoryController.update);
router.post('/history-medical-destroy', validateSchema(idMedicalHistorySchema), MedicalHistoryController.destroy);

//Rutas Consultas médicas
router.get('/consultation-medical', MedicalConsultationController.index);
router.post('/get-medical-consultations',  MedicalConsultationController.getByPersonId);
router.post('/consultation-medical', multerMultiple('files', 'consultations'), validateSchema(storeMedicalConsultationSchema), MedicalConsultationController.store);
router.post('/consultation-medical-show', validateSchema(idMedicalConsultationSchema), MedicalConsultationController.show);
router.post('/consultation-medical-update', multerMultiple('files', 'consultations'), validateSchema(updateMedicalConsultationSchema), MedicalConsultationController.update);
router.post('/consultation-medical-destroy', validateSchema(idMedicalConsultationSchema), MedicalConsultationController.destroy);

//Rutas Tipos
router.get('/type', TypeController.index);
router.post('/get-type', validateSchema(typeSchema), TypeController.getTypesByType);
router.post('/type', validateSchema(storeTypeSchema), TypeController.store);
router.post('/type-show', validateSchema(idTypeSchema), TypeController.show);
router.put('/type', validateSchema(updateTypeSchema), TypeController.update);
router.post('/type-destroy', validateSchema(idTypeSchema), TypeController.destroy);

//Rutas Exámenes médicos
router.get('/medical-exam', MedicalExamController.index);
router.post('/get-exam-person', validateSchema(getMedicalExamSchema), MedicalExamController.getByPersonId);
router.post('/medical-exam', multerCategory('archive', 'medicalexams'), validateSchema(storeMedicalExamSchema), MedicalExamController.store);
router.post('/medical-exam-show', validateSchema(idMedicalExamSchema), MedicalExamController.show);
router.post('/medical-exam-update', multerCategory('archive', 'medicalexams'), validateSchema(updateMedicalExamSchema), MedicalExamController.update);
router.post('/medical-exam-destroy', validateSchema(idMedicalExamSchema), MedicalExamController.destroy);

//Rutas Emergencias
router.get('/emergency', EmergencyController.index);
router.post('/get-emergency-person', validateSchema(getEmergencySchema), EmergencyController.getByPersonId);
router.post('/emergency',  validateSchema(storeEmergencySchema), EmergencyController.store);
router.post('/emergency-show', validateSchema(idEmergencySchema), EmergencyController.show);
router.put('/emergency', validateSchema(updateEmergencySchema), EmergencyController.update);
router.post('/emergency-destroy', validateSchema(idEmergencySchema), EmergencyController.destroy);


//Rutas Unificadas
router.get('/productcategory-productstatus-apk', ProductController.category_status);
router.post('/category-status-priority-apk', validateSchema(home_idTaskSchema), TaskController.category_status_priority);
router.post('/category-budgets', BudgetController.category_budgets);
router.get('/hometype-status-people-apk', HomeController.homeType_status_people);
router.post('/status-priority-type-apk', WishController.status_priority_type);
router.post('/get-type-state-severity', validateSchema(typeSchema), PersonalBackgroundController.getTypesByTypeStateSeverity);
router.post('/get-type-relationship', validateSchema(typeSchema), FamilyBackgroundController.getTypesByTypeRelation);
router.post('/get-type-diagnoses', validateSchema(typeSchema), DiagnosisController.getTypesByTypeRelation);
router.post('/get-type-consultations', validateSchema(typeSchema), MedicalConsultationController.getTypesByTypeRelation);

module.exports = router;