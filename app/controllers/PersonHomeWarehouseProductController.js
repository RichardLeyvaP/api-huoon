const { Op } = require('sequelize');
const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const { Person, Warehouse, HomePerson, Home, Product, PersonHomeWarehouseProduct, Status, Category, sequelize } = require('../models');
const logger = require('../../config/logger');
const { PersonProductRepository, HomeRepository, WareHouseRepository, StatusRepository, CategoryRepository } = require('../repositories');
const WarehouseRepository = require('../repositories/WareHouseRepository');
const ProductRepository = require('../repositories/ProductRepository');

const PersonHomeWarehouseProductController = {
    // Listar todos los productos por personas y almacenes
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a obtener los productos por persona y almacén`);

        try {
            // Obtener todas las asociaciones entre personas, hogares, almacenes, productos y estados con los datos de la tabla pivote
            const personHomeWarehouseProducts = await PersonProductRepository.findAll();

            if (!personHomeWarehouseProducts.length) {
                return res.status(404).json({ msg: 'No se encontraron productos', personHomeWarehouseProduct: personHomeWarehouseProducts });
            }

            res.status(200).json({
                personHomeWarehouseProduct: personHomeWarehouseProducts.map(phwp => ({
                    home_id: phwp.home_id, // ID del hogar (home)
                    person_id: phwp.person_id, // ID de la persona (person)
                    warehouse_id: phwp.warehouse_id, // ID del almacén (warehouse)
                    product_id: phwp.product_id, // ID del producto (product)
                    status_id: phwp.status_id, // ID del estado (status)
                    unit_price: phwp.unit_price, // Precio unitario
                    quantity: phwp.quantity, // Cantidad
                    total_price: phwp.total_price, // Precio total
                    purchase_date: phwp.purchase_date, // Fecha de compra
                    purchase_place: phwp.purchase_place, // Lugar de compra
                    expiration_date: phwp.expiration_date, // Fecha de expiración
                    brand: phwp.brand, // Marca
                    additional_notes: phwp.additional_notes, // Notas adicionales
                    maintenance_date: phwp.maintenance_date, // Fecha de mantenimiento
                    due_date: phwp.due_date, // Fecha de vencimiento
                    frequency: phwp.frequency, // Frecuencia
                    type: phwp.type, // Tipo
                    image: phwp.image, // Imagen del producto
                    status: phwp.status, // Información del estado
                    home: phwp.home, // Información del hogar (home)
                    person: phwp.person, // Información de la persona (person)
                    warehouse: phwp.warehouse, // Información del almacén (warehouse)
                    product: phwp.product, // Información del producto (product)
                }))
            });

        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en PersonHomeWarehouseProductController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async personHomeWarehouseProducts(req, res) {
        logger.info(`${req.user.name} - Consulta de los productos en un almacén específicode una persona en el hogar`);
    
        const { home_id, warehouse_id } = req.body;
    
        try {
            // Obtener el ID de la persona del usuario autenticado
            const person_id = req.person.id;

            
            // Verificar que el hogar existe
            const home = await HomeRepository.findById(home_id);
            if (!home) {
                logger.error(`PersonHomeWarehouseController->homeWarehouseProducts: Hogar no encontrado con ID ${home_id}`);
                return res.status(204).json({ msg: 'HomeNotFound' });
            }
    
            // Verificar si la persona está asociada con el hogar
            const person = await Person.findByPk(person_id, {
                include: [{
                    model: HomePerson,
                    as: 'homePeople',
                    where: { home_id: home_id },  // Filtra por el home_id que buscas
                    required: true  // Esto asegura que solo se devuelvan personas que tengan esa relación
                }]
            });
    
            if (!person) {
                logger.error(`PersonHomeWarehouseController->homeWarehouseProducts: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`);
                return res.status(204).json({ msg: 'PersonNotAssociatedWithHome' });
            }
    
    
            // Verificar que el almacén existe
            const warehouse = await WareHouseRepository.findById(warehouse_id);
            if (!warehouse) {
                logger.error(`PersonHomeWarehouseController->homeWarehouseProducts: Almacén no encontrado con ID ${warehouse_id}`);
                return res.status(204).json({ msg: 'HomeWarehouseNotFound' });
            }
    
            // Buscar los productos específicos en el almacén del hogar
            const homeWarehouseProducts = await PersonProductRepository.personHomeWarehouseProducts(req.body);
    
            if (!homeWarehouseProducts || homeWarehouseProducts.length === 0) {
                logger.error(`PersonHomeWarehouseController->homeWarehouseProducts: No se encontraron productos para home_id: ${home_id}, warehouse_id: ${warehouse_id}`);
                return res.status(204).json({ msg: 'NoProductsFound' });
            }
    
            // Mapear los productos encontrados
            const result = homeWarehouseProducts.map(homeWarehouseProduct => ({
                id: homeWarehouseProduct.id,
                homeId: homeWarehouseProduct.home_id,
                homeName: homeWarehouseProduct.home.name,  // Relación con el hogar
                warehouseId: homeWarehouseProduct.warehouse_id,
                warehouseName: homeWarehouseProduct.warehouse.title,  // Relación con el almacén
                productId: homeWarehouseProduct.product_id,
                productName: homeWarehouseProduct.product.name,  // Relación con el producto
                categoryId: homeWarehouseProduct.product.category_id,
                nameCategory: homeWarehouseProduct.product.category.name, // Lógica para obtener traducción de la categoría
                statusId: homeWarehouseProduct.status_id,
                nameStatus: homeWarehouseProduct.status.name,  // Lógica para obtener traducción del estado
                quantity: homeWarehouseProduct.quantity,
                unitPrice: homeWarehouseProduct.unit_price,
                totalPrice: homeWarehouseProduct.total_price,
                purchaseDate: homeWarehouseProduct.purchase_date,
                expirationDate: homeWarehouseProduct.expiration_date,
                purchasePlace: homeWarehouseProduct.purchase_place,
                brand: homeWarehouseProduct.brand ? homeWarehouseProduct.brand : "",
                additionalNotes: homeWarehouseProduct.additional_notes ? homeWarehouseProduct.additional_notes : "",
                image: homeWarehouseProduct.image
            }));
    
            res.status(200).json({ products: result });
    
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en PersonHomeWarehouseController->homeWarehouseProducts: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async store(req, res) {
        logger.info(`${req.user.name} - Inicia el proceso de asociar un almacén y producto  de una persona a un hogar específico`);
        logger.info('datos recibidos al crear un producto');
        logger.info(JSON.stringify(req.body));
        
        const { home_id, warehouse_id, product_id, status_id, unit_price, total_price, quantity, purchase_date, 
                purchase_place, expiration_date, brand, additional_notes, maintenance_date, 
                due_date, frequency, type, image, category_id, name} = req.body;                
    
        // Verificar si el hogar existe
        const home = await HomeRepository.findById(home_id);
        if (!home) {
            logger.error(`PersonHomeWarehouseController->store: Hogar no encontrado con ID ${home_id}`);
            return res.status(204).json({ msg: 'HomeNotFound' });
        }
    
        // Obtener el ID de la persona del usuario autenticado
        const person_id = req.person.id;
    
        // Verificar si la persona está asociada con el hogar
        const person = await Person.findByPk(person_id, {
            include: [{
                model: HomePerson,
                as: 'homePeople',
                where: { home_id: home_id },  // Filtra por el home_id que buscas
                required: true  // Esto asegura que solo se devuelvan personas que tengan esa relación
            }]
        });

        if (!person) {
            logger.error(`PersonHomeWarehouseController->store: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`);
            return res.status(204).json({ msg: 'PersonNotAssociatedWithHome' });
        }
    
        // Verificar si el almacén existe
        const warehouse = await WareHouseRepository.findById(warehouse_id);
        if (!warehouse) {
            logger.error(`PersonHomeWarehouseController->store: Almacén no encontrado con ID ${warehouse_id}`);
            return res.status(204).json({ msg: 'WarehouseNotFound' });
        }
    
        // Verificar si el estado existe
        const status = await StatusRepository.findById(status_id);
        if (!status) {
            logger.error(`PersonHomeWarehouseController->store: Estado no encontrado con ID ${status_id}`);
            return res.status(204).json({ msg: 'StatusNotFound' });
        }
    
        // Verificar si el producto existe o crear uno nuevo
        let product;
        let filename;
        if (product_id && product_id !== undefined) {
            product = await Product.findByPk(product_id);
            if (!product) {
                logger.error(`PersonHomeWarehouseController->store: Producto no encontrado con ID ${product_id}`);
                return res.status(204).json({ msg: 'ProductNotFound' });
            } else {
                filename = product.image;
            }
        }
    
        // Verificar si la categoría existe
        if (category_id && category_id !== 0) {
            const category = await CategoryRepository.findById(category_id);
            if (!category) {
                logger.error(`PersonHomeWarehouseController->store: Categoría no encontrada con ID ${category_id}`);
                return res.status(204).json({ msg: 'CategoryNotFound' });
            }
        }
    
        // Iniciar una transacción
        const t = await sequelize.transaction();
        try {
            // Si no existe el producto, crear uno nuevo
            if (!product) {
                logger.info('PersonHomeWarehouseController->store: Creando nuevo producto');
                product = await ProductRepository.create(req.body, req.file);

                req.body.product_id = product.id;
            }
    
            const personHomeWarehouseProduct = await PersonProductRepository.create(req.body, req.file, t, person_id)
    
            // Confirmar la transacción
            await t.commit();
        
            res.status(201).json({ personHomeWarehouseProduct: personHomeWarehouseProduct });
    
        } catch (error) {
            // Hacer rollback en caso de error
            if (!t.finished) {
                await t.rollback();
            }
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en PersonHomeWarehouseProductController->store: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Ver detalles de un producto específico en un almacén de un hogar para una persona
    async show(req, res) {
        logger.info(`${req.user.name} - Consulta del producto específico en un almacén para el hogar de una persona`);

        try {

            // Buscar el producto específico en el almacén del hogar de la persona
            const personHomeWarehouseProduct = await PersonProductRepository.findById(req.body.id);
            
            if (!personHomeWarehouseProduct) {
                logger.error(`PersonHomeWarehouseProductController->show: No se encontro el producto en el alamcen con id: ${req.body.id}`);
                return res.status(204).json({ msg: 'PersonHomeWarehouseProductNotFound' });
            }
            
            const result = {
                id: personHomeWarehouseProduct.id,
                personId: personHomeWarehouseProduct.person_id,
                personName: personHomeWarehouseProduct.person.name,  // Relación con la persona
                homeId: personHomeWarehouseProduct.home_id,
                homeName: personHomeWarehouseProduct.home.name,  // Relación con el hogar
                warehouseId: personHomeWarehouseProduct.warehouse_id,
                warehouseName: personHomeWarehouseProduct.warehouse.title,  // Relación con el almacén
                productId: personHomeWarehouseProduct.product_id,
                productName: personHomeWarehouseProduct.product.name,  // Relación con el producto
                categoryId: personHomeWarehouseProduct.product.category_id,
                nameCategory: personHomeWarehouseProduct.product.category.name, // Lógica para obtener traducción de la categoría
                statusId: personHomeWarehouseProduct.status_id,
                nameStatus: personHomeWarehouseProduct.status.name,  // Lógica para obtener traducción del estado
                quantity: personHomeWarehouseProduct.quantity,
                unitPrice: personHomeWarehouseProduct.unit_price,
                totalPrice: personHomeWarehouseProduct.total_price,
                purchaseDate: personHomeWarehouseProduct.purchase_date,
                expirationDate: personHomeWarehouseProduct.expiration_date,
                purchasePlace: personHomeWarehouseProduct.purchase_place,
                brand: personHomeWarehouseProduct.brand,
                additionalNotes: personHomeWarehouseProduct.additional_notes,
                image: personHomeWarehouseProduct.image
            };
            res.status(200).json({ homewarehouseproduct: [result] });

        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en PersonHomeWarehouseController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async update(req, res) {
        logger.info(`${req.user.name} - Inicia actualización de relación en person_home_warehouse_products`);
        logger.info('Datos recibidos al editar un producto en un almacén');
        logger.info(JSON.stringify(req.body));
    
        const {
            id, // El ID del registro en la tabla person_home_warehouse_products
            home_id, warehouse_id, product_id, status_id, unit_price, total_price,
            quantity, purchase_date, expiration_date, purchase_place, brand, additional_notes,
            maintenance_date, due_date, frequency, type, image, category_id, name
        } = req.body;
    

            // Verificar la existencia del registro por ID
            const personHomeWarehouseProduct = await PersonProductRepository.findById(id);
            if (!personHomeWarehouseProduct) {
                logger.error(`PersonHomeWarehouseProductsController->update: Registro no encontrado con ID ${id}`);
                return res.status(204).json({ error: 'NotFound', message: `No se encontró un registro con el ID ${id}` });
            }

        const t = await sequelize.transaction();
        try {
    
            // Validar que el producto, almacén, hogar y estado existan
            if (home_id) {
                const home = await HomeRepository.findById(home_id);
                if (!home) {
                    logger.error(`PersonHomeWarehouseProductsController->update: Hogar no encontrado con ID ${home_id}`);
                    return res.status(204).json({ msg: 'HomeNotFound' });
                }
            }
    
            if (warehouse_id) {
                const warehouse = await WarehouseRepository.findById(warehouse_id);
                if (!warehouse) {
                    logger.error(`PersonHomeWarehouseProductsController->update: Almacén no encontrado con ID ${warehouse_id}`);
                    return res.status(204).json({ msg: 'WarehouseNotFound' });
                }
            }
            let product;
            if (product_id) {
                product = await ProductRepository.findById(product_id);
                if (!product) {
                    logger.error(`PersonHomeWarehouseProductsController->update: Producto no encontrado con ID ${product_id}`);
                    return res.status(204).json({ msg: 'ProductNotFound' });
                }
            }else{
                product = await ProductRepository.findById(personHomeWarehouseProduct.product_id);
            }
    
            if (status_id) {
                const status = await StatusRepository.findById(status_id);
                if (!status) {
                    logger.error(`PersonHomeWarehouseProductsController->update: Estado no encontrado con ID ${status_id}`);
                    return res.status(204).json({ msg: 'StatusNotFound' });
                }
            }

            //Actualizar datos del producto
            if (category_id || name) {
            const productUodate = await ProductRepository.update(product, req.body, req.file, t);
            }
    
            const personHomeWarehouseProductUpdate = await PersonProductRepository.update(personHomeWarehouseProduct, req.body, req.file, t);
            // Confirmar la transacción
            await t.commit();
       
            return res.status(200).json({'personHomeWarehouseProduct': personHomeWarehouseProductUpdate});
        } catch (error) {
            await t.rollback();
            logger.error(`Error en PersonHomeWarehouseProductsController->update: ${error.message}`);
            return res.status(500).json({ error: 'ServerError', details: error.message });
        }
    },
    /*async update(req, res) {
        logger.info(`${req.user.name} - Inicia actualización de relación en person_home_warehouse_products`);
        logger.info('datos recibidos al editar un producto en un almacen');
        logger.info(JSON.stringify(req.body));

        // Validación de entrada
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en PersonHomeWarehouseProductsController->update: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        // Desestructuración de valores del cuerpo de la solicitud
        const {
            home_id, warehouse_id, product_id, status_id, unit_price, total_price,
            quantity, purchase_date, expiration_date, purchase_place, brand, additional_notes,
            maintenance_date, due_date, frequency, type, image, category_id, name
        } = value;
    
        const home = await Home.findByPk(home_id);
        if (!home) {
            logger.error(`PersonHomeWarehouseProductsController->update: Hogar no encontrado con ID ${home_id}`);
            return res.status(204).json({ msg: 'HomeNotFound' });
        }
        // Obtener el ID de la persona del usuario autenticado
        const person_id = req.person.id;
        
        // Verificar si la persona está asociada con el hogar
        const person = await Person.findByPk(person_id, {
            include: [{
                model: HomePerson,
                as: 'homePeople',
                where: { home_id: home_id },  // Filtra por el home_id que buscas
                required: true  // Esto asegura que solo se devuelvan personas que tengan esa relación
            }]
        });

        if (!person) {
            logger.error(`PersonHomeWarehouseController->show: La persona con ID ${person_id} no está asociada con el hogar con ID ${home_id}`);
            return res.status(204).json({ msg: 'PersonNotAssociatedWithHome' });
        }
    
        const warehouse = await Warehouse.findByPk(warehouse_id);
        if (!warehouse) {
            logger.error(`PersonHomeWarehouseProductsController->update: Almacén no encontrado con ID ${warehouse_id}`);
            return res.status(204).json({ msg: 'WarehouseNotFound' });
        }
    
        const status = await Status.findByPk(status_id);
        if (!status) {
            logger.error(`PersonHomeWarehouseProductsController->update: Estado no encontrado con ID ${status_id}`);
            return res.status(204).json({ msg: 'StatusNotFound' });
        }
    
        let product;
        let filename;
        if (product_id && product_id !== 0) {
            product = await Product.findByPk(product_id);
            if (!product) {
                logger.error(`PersonHomeWarehouseProductsController->update: Producto no encontrado con ID ${product_id}`);
                return res.status(204).json({ msg: 'ProductNotFound' });
            }
        } else {
            filename = product.image;
        }

        // Verificar si la categoría existe
        if (category_id && category_id !== 0) {
            const category = await Category.findByPk(category_id);
            if (!category) {
                logger.error(`HomeWarehouseProductController->store: Categoría no encontrado con ID ${category_id}`);
                return res.status(204).json({ msg: 'CategoryNotFound' });
            }
        }
    
        // Iniciar una transacción para asegurar la atomicidad
        const t = await sequelize.transaction();
        try {

            if (!product) {
                logger.info('HomeWarehouseProductController->store: Creando nuevo producto');
                filename = 'products/default.jpg'; // Imagen por defecto
                product = await Product.create({
                    name: name,
                    category_id: category_id,
                    image: filename
                }, {transaction: t});

                // Manejo del archivo de icono (si se ha subido)
                if (req.file) {
                    const extension = path.extname(req.file.originalname);
                    const newFilename = `products/${product.id}${extension}`;
                    
                    try {
                        // Mover el archivo a la carpeta pública
                        const oldPath = req.file.path;
                        const newPath = path.join(__dirname, '..', '..', 'public', newFilename);
                
                        await fs.promises.rename(oldPath, newPath); // Usa await para esperar hasta que se mueva
                
                        // Actualizar el registro con la ruta del archivo
                        await product.update({ image: newFilename }, { transaction: t });
                        filename = newFilename;
                    } catch (err) {
                        logger.error('Error al mover la imagen: ' + err.message);
                        throw new Error('Error al mover la imagen'); // Esto permitirá que el catch lo maneje y haga rollback
                    }
                }
            }
            // Crear o actualizar la relación `person_home_warehouse_product`
            const [personHomeWarehouseProduct, created] = await PersonHomeWarehouseProduct.findOrCreate({
                where: { person_id, home_id, warehouse_id, product_id: product.id },
                defaults: {
                    status_id, unit_price, total_price, quantity,
                    purchase_date: purchase_date || new Date(),
                    expiration_date, purchase_place, brand, additional_notes,
                    maintenance_date, due_date, frequency, type, image: product.image
                },
                transaction: t
            });
             // Paso 2: Copiar la imagen a la nueva carpeta con el ID de `homeWarehouseProduct`
             if (req.file && created) {
                const extension = path.extname(req.file.originalname);
                const newImagePath = `personHomeWarehoseProducts/${personHomeWarehouseProduct.id}${extension}`;
                const destinationPath = path.join(__dirname, '..', '..', 'public', newImagePath);

                try {
                    // Copiar el archivo desde `products` a la carpeta `images` con el ID de `homeWarehouseProduct`
                    const tempPath = path.join(__dirname, '..', '..', 'public', filename);
                    await fs.promises.copyFile(tempPath, destinationPath);

                    // Actualizar el registro de `homeWarehouseProduct` con la nueva ruta
                    await personHomeWarehouseProduct.update({ image: newImagePath }, { transaction: t });

                } catch (err) {
                    logger.error('Error al copiar la imagen a la carpeta de destino: ' + err.message);
                    throw new Error('Error al copiar la imagen'); // Esto permitirá que el catch lo maneje y haga rollback
                }
            }
            
            const updatedData = Object.keys(req.body)
                    .filter(key => [
                        'home_id', 'warehouse_id', 'product_id', 'status_id', 'unit_price', 'total_price', 'quantity', 'purchase_date', 
                        'purchase_place', 'expiration_date', 'brand', 'additional_notes', 'maintenance_date', 
                        'due_date', 'frequency', 'type', 'image', 'category_id', 'name', 'person_id'
                    ].includes(key) && req.body[key] !== undefined)
                    .reduce((obj, key) => ({ ...obj, [key]: req.body[key] }), {});
    
             // Actualizar solo los campos enviados si el producto ya existía
             if (!created) {
                // Procesar la actualización del icono
                if (req.file) {
                   // Si se envía un archivo nuevo
                   const extension = path.extname(req.file.originalname);
                   const newFilename = `personHomeWarehoseProducts/${personHomeWarehouseProduct.id}${extension}`;

                   // Eliminar el icono anterior si existe y no es el predeterminado
                   if (personHomeWarehouseProduct.image !== 'personHomeWarehoseProducts/default.jpg') {
                       const oldIconPath = path.join(__dirname, '../../public', personHomeWarehouseProduct.image);
                       try {
                           await fs.promises.unlink(oldIconPath);
                           logger.info(`Imagen anterior eliminada: ${oldIconPath}`);
                       } catch (error) {
                           logger.error(`Error al eliminar la imagen anterior: ${error.message}`);
                       }
                   }

                   // Mover el nuevo archivo a la carpeta pública
                   const newPath = path.join(__dirname, '../../public', newFilename);
                   await fs.promises.rename(req.file.path, newPath);
                   updatedData.image = newFilename;

               }
               
               if (Object.keys(updatedData).length > 0) {
                   await PersonHomeWarehouseProduct.update(updatedData, {
                       where: { product_id: product.id, warehouse_id: warehouse_id, home_id: home_id, person_id: person_id },
                       transaction: t
                   });
                   logger.info(`Campos actualizados en HomeWarehouseProduct para producto ID ${product.id}`);
               }
           }
   
           // Obtener la relación actualizada
           const updatedPersonWarehouse = await PersonHomeWarehouseProduct.findOne({
               where: { product_id: product.id, warehouse_id: warehouse_id, home_id: home_id, person_id: person_id },
               transaction: t
           });
    
            // Confirmar la transacción
            await t.commit();
    
            // Obtener la relación actualizada para devolverla en la respuesta
            const updatedRecord = await PersonHomeWarehouseProduct.findOne({
                where: { person_id, home_id, warehouse_id, product_id: product.id },
                include: [
                    { model: Person, as: 'person', attributes: ['id', 'name'] },
                    { model: Home, as: 'home', attributes: ['id', 'name'] },
                    { model: Warehouse, as: 'warehouse', attributes: ['id', 'title', 'description', 'status'] },
                    { model: Product, as: 'product', attributes: ['id', 'name'], 
                      include: [{ model: Category, as: 'category', attributes: ['name'] }]
                    },
                    { model: Status, as: 'status', attributes: ['id', 'name'] }
                ]
            });
    
            return res.status(200).json(updatedRecord);
        } catch (error) {
            await t.rollback();
            const errorMsg = error.message || 'Error desconocido';
            logger.error(`Error en PersonHomeWarehouseProductsController->update: ${errorMsg}`);
            return res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },*/

    // Eliminar un producto de un almacen en un hogar
    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando un producto de un almacen en un hogar`);

        try {
            // Buscar el registro en person_home_warehouse_products
            const personHomeWarehouseProduct = await PersonProductRepository.findById(req.body.id);
            if (!personHomeWarehouseProduct) {
                logger.error(`PersonHomeWarehouseProductsController->destroy: Producto no encontrado con ID ${req.body.id}`);
                return res.status(204).json({ msg: 'PersonHomeWarehouseProductNotFound' });
            }

           const personHomeWarehouseProductDelete = await PersonProductRepository.delete(personHomeWarehouseProduct);
            // Responder con éxito
            res.status(200).json({ msg: 'PersonHomeWarehouseProductDeleted' });
        } catch (error) {
            const errorMsg = error.message || 'Error desconocido';
            logger.error(`PersonHomeWarehouseProductsController->destroy: ${errorMsg}`);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }
}

module.exports = PersonHomeWarehouseProductController;
