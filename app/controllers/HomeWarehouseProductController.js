const { Op } = require('sequelize');
const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const { Warehouse, Home, Product, HomeWarehouseProduct, Status, Category, sequelize } = require('../models');
const logger = require('../../config/logger');

const schema = Joi.object({
    home_id: Joi.number().integer().optional(),
    warehouse_id: Joi.number().integer().optional(),
    product_id: Joi.number().integer().optional(),
    status_id: Joi.number().integer().optional(),
    category_id: Joi.number().integer().optional(),
    name: Joi.string().max(255).optional(),
    unit_price: Joi.number().precision(2).optional(),
    quantity: Joi.number().optional(),
    total_price: Joi.number().precision(2).optional(),
    purchase_date: Joi.date().optional(),
    purchase_place: Joi.string().optional(),
    expiration_date: Joi.date().optional(),
    brand: Joi.string().optional(),
    additional_notes: Joi.string().optional(),
    maintenance_date: Joi.date().optional(),
    due_date: Joi.date().optional(),
    frequency: Joi.string().optional(),
    type: Joi.string().optional(),
    image: Joi.string()
        .pattern(/\.(jpg|jpeg|png|gif)$/i)  // Validar formato de imagen
        .allow(null)                        // Permite que sea nulo (opcional)
        .optional()                         // Hace que sea opcional
        .custom((value, helpers) => {
            const maxSize = 500 * 1024;     // 500 KB en bytes
            if (value && value.length > maxSize) {
                return helpers.message('El campo image debe ser una imagen válida de máximo 500 KB');
            }
            return value;
        })
        .messages({
            'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif)',
        }),
        id: Joi.number().integer().optional(),
});

const HomeWarehouseProductController = {
    // Listar todos los almacenes
    async index(req, res) {
        logger.info(`${req.user.name} - Entra a obtener los productos por almacenes`);
    
        try {
            // Obtener todas las asociaciones entre personas y almacenes con los datos de la tabla pivote
            const homeWarehouseProducts = await HomeWarehouseProduct.findAll({
                include: [
                    {
                        model: Home,
                        as: 'home', // Asociación con el modelo Person
                        attributes: ['id', 'name'] // Ajusta los atributos de Person que quieres devolver
                    },
                    {
                        model: Warehouse,
                        as: 'warehouse', // Asociación con el modelo Warehouse
                        attributes: ['id', 'title'] // Ajusta los atributos de Warehouse según sea necesario
                    },
                    {
                        model: Status,
                        as: 'status', // Asociación con el modelo Warehouse
                        attributes: ['id', 'name'] // Ajusta los atributos de Warehouse según sea necesario
                    },
                    {
                        model: Product,
                        as: 'product', // Asociación con el modelo Warehouse
                        attributes: ['id', 'name'] // Ajusta los atributos de Warehouse según sea necesario
                    }
                ]
            });
    
            if (!homeWarehouseProducts.length) {
                return res.status(404).json({ msg: 'No products found', homeWarehouseProduct: homeWarehouseProducts });
            }
    
            res.status(200).json({
                homeWarehouseProduct: homeWarehouseProducts.map(hwp => ({
                    home_id: hwp.home_id, // ID de la persona (home)
                    warehouse_id: hwp.warehouse_id, // ID del almacén (warehouse)
                    product_id: hwp.product_id, // ID del producto (product)
                    status_id: hwp.status_id, // ID del estado (status)
                    unit_price: hwp.unit_price, // Precio unitario
                    quantity: hwp.quantity,
                    total_price: hwp.total_price, // Precio total
                    purchase_date: hwp.purchase_date, // Fecha de compra
                    purchase_place: hwp.purchase_place, // Lugar de compra
                    expiration_date: hwp.expiration_date, // Fecha de expiración
                    brand: hwp.brand, // Marca
                    additional_notes: hwp.additional_notes, // Notas adicionales
                    maintenance_date: hwp.maintenance_date, // Fecha de mantenimiento
                    due_date: hwp.due_date, // Fecha de vencimiento
                    frequency: hwp.frequency, // Frecuencia
                    type: hwp.type, // Tipo
                    image: hwp.image, // Imagen del producto
                    status: hwp.status, // Información del estado
                    home: hwp.home, // Información de la persona (home)
                    warehouse: hwp.warehouse, // Información del almacén (warehouse)
                    product: hwp.product, // Información del producto (product)
                }))
            });
    
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en HomeWarehouseProductController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async homeWarehouseProducts(req, res) {
        logger.info(`${req.user.name} - Consulta de los productos en un almacén específico para el hogar`);
    
        // Validación de los parámetros
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en WarehouseController->index: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const { home_id, warehouse_id } = value;
    
        try {
            // Verificar que el hogar existe
            const home = await Home.findByPk(home_id);
            if (!home) {
                logger.error(`WarehouseController->index: Hogar no encontrado con ID ${home_id}`);
                return res.status(404).json({ msg: 'HomeNotFound' });
            }

            const warehouse = await Warehouse.findByPk(warehouse_id);
            if (!warehouse) {
                logger.error(`HomeWarehouseProductController->index: Almacen no encontrado con ID ${warehouse_id}`);
                return res.status(404).json({ msg: 'HomeWarehouseNotFound' });
            }
    
            // Buscar los productos específicos en el almacén del hogar
            const homeWarehouseProducts = await HomeWarehouseProduct.findAll({
                where: {
                    home_id: home_id,
                    warehouse_id: warehouse_id
                },
                include: [
                    {
                        model: Home,
                        as: 'home',
                        attributes: ['id', 'name'] // Datos del hogar
                    },
                    {
                        model: Warehouse,
                        as: 'warehouse',
                        attributes: ['id', 'title', 'description', 'status'] // Datos del almacén
                    },
                    {
                        model: Product,
                        as: 'product',
                        attributes: ['id', 'name'], // Datos del producto
                        include: [
                            {
                                model: Category,
                                as: 'category', // Relación con Category
                                attributes: ['name']
                            }
                        ]
                    },
                    {
                        model: Status,
                        as: 'status',
                        attributes: ['id', 'name'] // Datos del almacén
                    }
                ]
            });
    
            if (!homeWarehouseProducts || homeWarehouseProducts.length === 0) {
                logger.error(`WarehouseController->index: No se encontraron productos para home_id: ${home_id}, warehouse_id: ${warehouse_id}`);
                return res.status(404).json({ msg: 'NoProductsFound' });
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
                brand: homeWarehouseProduct.brand,
                additionalNotes: homeWarehouseProduct.additional_notes,
                image: homeWarehouseProduct.image
            }));
    
            res.status(200).json({ homewarehouseproducts: result });
    
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->index: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async store(req, res) {
        logger.info(`${req.user.name} - Inicia el proceso de asociar un almacén y producto a un hogar específico`);
    
        // Validar el cuerpo de la solicitud
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en HomeWarehouseProductController->store: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const { home_id, warehouse_id, product_id, status_id, unit_price, total_price, quantity, purchase_date, 
                purchase_place, expiration_date, brand, additional_notes, maintenance_date, 
                due_date, frequency, type, image, category_id, name } = value;
    
        // Verificar si el hogar existe
        const home = await Home.findByPk(home_id);
        if (!home) {
            logger.error(`HomeWarehouseProductController->store: Hogar no encontrado con ID ${home_id}`);
            return res.status(404).json({ msg: 'HomeNotFound' });
        }

        // Verificar si el hogar existe
        const warehouse = await Warehouse.findByPk(warehouse_id);
        if (!warehouse) {
            logger.error(`HomeWarehouseProductController->store: Almacén no encontrado con ID ${warehouse_id}`);
            return res.status(404).json({ msg: 'WarehouseNotFound' });
        }
    
        const status = await Status.findByPk(status_id);
        if (!status) {
            logger.error(`HomeWarehouseProductController->store: Estado no encontrado con ID ${status_id}`);
            return res.status(404).json({ msg: 'StatusNotFound' });
        }

        // Buscar o crear el almacén según `warehouse_id`
        let product;
        let filename;
        if (product_id !== undefined) {
            product = await Product.findByPk(product_id);
            if (!product) {
                logger.error(`PersonWarehouseController->store: Producto no encontrado con ID ${product_id}`);
                return res.status(404).json({ msg: 'ProductNotFound' });
            }
            else{
                filename = product.image;
            }
            
        } 

           // Verificar si la categoría existe
        if (category_id !== undefined) {
            const category = await Category.findByPk(category_id);
            if (!category) {
                logger.error(`HomeWarehouseProductController->store: Categoría no encontrado con ID ${category_id}`);
                return res.status(404).json({ msg: 'CategoryNotFound' });
            }
        }
    
        // Iniciar una transacción
        const t = await sequelize.transaction();
        try {
            // Si no existe el almacén, crearlo
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
    
            // Asociar el producto al almacén y al hogar en `home_warehouse_product`
            const [homeWarehouseProduct, created] = await HomeWarehouseProduct.findOrCreate({
                where: {
                    warehouse_id: warehouse_id,
                    home_id: home_id,
                    product_id: product.id
                },
                defaults: {
                    status_id: status_id,
                    unit_price: unit_price,
                    total_price: total_price,
                    purchase_date: purchase_date || new Date(), // Usa la fecha actual si purchase_date es nulo o no está definido
                    purchase_place: purchase_place,
                    expiration_date: expiration_date,
                    brand: brand,
                    quantity: quantity,
                    additional_notes: additional_notes,
                    maintenance_date: maintenance_date,
                    due_date: due_date,
                    frequency: frequency,
                    type: type,
                    image: filename
                },
                transaction: t
            });

            // Paso 2: Copiar la imagen a la nueva carpeta con el ID de `homeWarehouseProduct`
            if (req.file && created) {
                const extension = path.extname(req.file.originalname);
                const newImagePath = `homeWarehoseProducts/${homeWarehouseProduct.id}${extension}`;
                const destinationPath = path.join(__dirname, '..', '..', 'public', newImagePath);

                try {
                    // Copiar el archivo desde `products` a la carpeta `images` con el ID de `homeWarehouseProduct`
                    const tempPath = path.join(__dirname, '..', '..', 'public', filename);
                    await fs.promises.copyFile(tempPath, destinationPath);

                    // Actualizar el registro de `homeWarehouseProduct` con la nueva ruta
                    await homeWarehouseProduct.update({ image: newImagePath }, { transaction: t });

                } catch (err) {
                    logger.error('Error al copiar la imagen a la carpeta de destino: ' + err.message);
                    throw new Error('Error al copiar la imagen'); // Esto permitirá que el catch lo maneje y haga rollback
                }
            }
    
            // Confirmar la transacción
            await t.commit();
    
            // Obtener la relación actualizada desde `HomeWarehouseProduct`
            const updatedHomeWarehouseProduct = await HomeWarehouseProduct.findOne({
                where: {
                    home_id: home_id,
                    warehouse_id: warehouse.id,
                    product_id: product.id
                },
                include: [
                    { model: Home, as: 'home', attributes: ['id', 'name'] },
                    { model: Warehouse, as: 'warehouse', attributes: ['id', 'title'] },
                    { model: Product, as: 'product', attributes: ['id', 'name'] },
                    { model: Status, as: 'status', attributes: ['id', 'name'] }
                ]
            });
            
            res.status(201).json({ homeWarehouseProduct: updatedHomeWarehouseProduct });
    
        } catch (error) {
            // Hacer rollback en caso de error
            if (!t.finished) {
                await t.rollback();
            }
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en HomeWarehouseProductController->store: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },
    // Ver detalles de un producto específico en un almacén de un hogar
    async show(req, res) {
        logger.info(`${req.user.name} - Consulta del producto específico en un almacén para el hogar`);

        // Validación de los parámetros
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en WarehouseController->show: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }

        const { home_id, warehouse_id, product_id } = value;

        try {
            // Verificar que el hogar existe
            const home = await Home.findByPk(home_id);
            if (!home) {
                logger.error(`WarehouseController->show: Hogar no encontrado con ID ${home_id}`);
                return res.status(404).json({ msg: 'HomeNotFound' });
            }

            // Buscar el producto específico en el almacén del hogar
            const homeWarehouseProduct = await HomeWarehouseProduct.findOne({
                where: {
                    home_id: home_id,
                    warehouse_id: warehouse_id,
                    product_id: product_id
                },
                include: [
                    {
                        model: Home,
                        as: 'home',
                        attributes: ['id', 'name'] // Datos del hogar
                    },
                    {
                        model: Warehouse,
                        as: 'warehouse',
                        attributes: ['id', 'title', 'description', 'status'] // Datos del almacén
                    },
                    {
                        model: Product,
                        as: 'product',
                        attributes: ['id', 'name'], // Datos del producto
                        include: [
                            {
                                model: Category,
                                as: 'category', // Relación con Category
                                attributes: ['name']
                            }
                        ]
                    },
                    {
                        model: Status,
                        as: 'status',
                        attributes: ['id', 'name'] // Datos del almacén
                    }
                ]
            });

            if (!homeWarehouseProduct) {
                logger.error(`WarehouseController->show: No se encontró la relación para home_id: ${home_id}, warehouse_id: ${warehouse_id}, product_id: ${product_id}`);
                return res.status(404).json({ msg: 'HomeWarehouseProductNotFound' });
            }

            const result = {
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
                brand: homeWarehouseProduct.brand,
                additionalNotes: homeWarehouseProduct.additional_notes,
                image: homeWarehouseProduct.image
            };
            res.status(200).json({ homewarehouseproduct: [result] });

        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en WarehouseController->show: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    async update(req, res) {
        logger.info(`${req.user.name} - Entra a actualizar la relación entre producto, almacén y hogar específico`);
    
        const { error, value } = schema.validate(req.body);
        if (error) {
            const errorMsg = error.details.map(detail => detail.message).join(', ');
            logger.error('Error en HomeWarehouseProductController->update: ' + errorMsg);
            return res.status(400).json({ error: 'ValidationError', details: errorMsg });
        }
    
        const { home_id, warehouse_id, product_id, status_id, unit_price, total_price, quantity, purchase_date, 
            purchase_place, expiration_date, brand, additional_notes, maintenance_date, 
            due_date, frequency, type, image, category_id, name } = value;

        // Verificar si el hogar existe
        const home = await Home.findByPk(home_id);
        if (!home) {
            logger.error(`HomeWarehouseProductController->store: Hogar no encontrado con ID ${home_id}`);
            return res.status(404).json({ msg: 'HomeNotFound' });
        }

        // Verificar si el hogar existe
        const warehouse = await Warehouse.findByPk(warehouse_id);
        if (!warehouse) {
            logger.error(`HomeWarehouseProductController->store: Almacén no encontrado con ID ${warehouse_id}`);
            return res.status(404).json({ msg: 'WarehouseNotFound' });
        }
    
        const status = await Status.findByPk(status_id);
        if (!status) {
            logger.error(`HomeWarehouseProductController->store: Estado no encontrado con ID ${status_id}`);
            return res.status(404).json({ msg: 'StatusNotFound' });
        }

        // Buscar o crear el almacén según `warehouse_id`
        let product;
        let filename;
        if (product_id !== undefined) {
            product = await Product.findByPk(product_id);
            if (!product) {
                logger.error(`PersonWarehouseController->store: Producto no encontrado con ID ${product_id}`);
                return res.status(404).json({ msg: 'ProductNotFound' });
            }
            else{
                filename = product.image;
            }
            
        } 

           // Verificar si la categoría existe
        if (category_id !== undefined) {
            const category = await Category.findByPk(category_id);
            if (!category) {
                logger.error(`HomeWarehouseProductController->store: Categoría no encontrado con ID ${category_id}`);
                return res.status(404).json({ msg: 'CategoryNotFound' });
            }
        }
    
    
        const t = await sequelize.transaction(); // Iniciar una nueva transacción
    
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
            // Asociar el producto al almacén y al hogar en `home_warehouse_product`
            const [homeWarehouseProduct, created] = await HomeWarehouseProduct.findOrCreate({
                where: {
                    warehouse_id: warehouse_id,
                    home_id: home_id,
                    product_id: product.id
                },
                defaults: {
                    status_id: status_id,
                    unit_price: unit_price,
                    total_price: total_price,
                    purchase_date: purchase_date || new Date(), // Usa la fecha actual si purchase_date es nulo o no está definido
                    purchase_place: purchase_place,
                    expiration_date: expiration_date,
                    brand: brand,
                    quantity: quantity,
                    additional_notes: additional_notes,
                    maintenance_date: maintenance_date,
                    due_date: due_date,
                    frequency: frequency,
                    type: type,
                    image: filename
                },
                transaction: t
            });
            // Paso 2: Copiar la imagen a la nueva carpeta con el ID de `homeWarehouseProduct`
            if (req.file && created) {
                const extension = path.extname(req.file.originalname);
                const newImagePath = `homeWarehoseProducts/${homeWarehouseProduct.id}${extension}`;
                const destinationPath = path.join(__dirname, '..', '..', 'public', newImagePath);

                try {
                    // Copiar el archivo desde `products` a la carpeta `images` con el ID de `homeWarehouseProduct`
                    const tempPath = path.join(__dirname, '..', '..', 'public', filename);
                    await fs.promises.copyFile(tempPath, destinationPath);

                    // Actualizar el registro de `homeWarehouseProduct` con la nueva ruta
                    await homeWarehouseProduct.update({ image: newImagePath }, { transaction: t });

                } catch (err) {
                    logger.error('Error al copiar la imagen a la carpeta de destino: ' + err.message);
                    throw new Error('Error al copiar la imagen'); // Esto permitirá que el catch lo maneje y haga rollback
                }
            }
            const updatedData = Object.keys(req.body)
                    .filter(key => [
                        'home_id', 'warehouse_id', 'product_id', 'status_id', 'unit_price', 'total_price', 'quantity', 'purchase_date', 
                        'purchase_place', 'expiration_date', 'brand', 'additional_notes', 'maintenance_date', 
                        'due_date', 'frequency', 'type', 'image', 'category_id', 'name'
                    ].includes(key) && req.body[key] !== undefined)
                    .reduce((obj, key) => ({ ...obj, [key]: req.body[key] }), {});
             // Actualizar solo los campos enviados si el producto ya existía
            if (!created) {
                 // Procesar la actualización del icono
                 if (req.file) {
                    // Si se envía un archivo nuevo
                    const extension = path.extname(req.file.originalname);
                    const newFilename = `homeWarehoseProducts/${homeWarehouseProduct.id}${extension}`;

                    // Eliminar el icono anterior si existe y no es el predeterminado
                    if (homeWarehouseProduct.image !== 'homeWarehoseProducts/default.jpg') {
                        const oldIconPath = path.join(__dirname, '../../public', homeWarehouseProduct.image);
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
                    await HomeWarehouseProduct.update(updatedData, {
                        where: { product_id: product.id, warehouse_id: warehouse_id, home_id: home_id },
                        transaction: t
                    });
                    logger.info(`Campos actualizados en HomeWarehouseProduct para producto ID ${product.id}`);
                }
            }
    
            // Obtener la relación actualizada
            const updatedPersonWarehouse = await HomeWarehouseProduct.findOne({
                where: { product_id: product.id, warehouse_id: warehouse_id, home_id: home_id },
                transaction: t
            });
    
            // Confirmar la transacción
            await t.commit();
    
            // Responder con la relación actualizada
            res.status(200).json({ personWarehouse: updatedPersonWarehouse });
        } catch (error) {
            // Si ocurre un error, hacer rollback de la transacción
            await t.rollback();
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';
            logger.error('Error en HomeWarehouseProductController->update: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    },

    // Eliminar un producto de un almacen en un hogar
    async destroy(req, res) {
        logger.info(`${req.user.name} - Eliminando un producto de un almacen en un hogar`);

        const schema = Joi.object({
            id: Joi.number().required()
        });
    
        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`Error de validación en HomeWarehouseProductController->destroy: ${error.details.map(err => err.message).join(', ')}`);
            return res.status(400).json({ msg: error.details.map(err => err.message) });
        }

        try {
            const homeWarehouseProduct = await HomeWarehouseProduct.findByPk(req.body.id);
            if (!homeWarehouseProduct) {
                logger.error(`HomeWarehouseProductController->destroy: Producto no encontrado`);
                return res.status(404).json({ msg: 'HomeWareHouseProductNotFound' });
            }

            if (homeWarehouseProduct.image && homeWarehouseProduct.image !== 'homeWarehouseProducts/default.jpg') {
                const oldIconPath = path.join(__dirname, '../../public', homeWarehouseProduct.image);
                try {
                    await fs.promises.unlink(oldIconPath);
                    logger.info(`Imagen anterior eliminada: ${oldIconPath}`);
                } catch (error) {
                    logger.error(`Error al eliminar la imagen anterior: ${error.message}`);
                }
            }

            await homeWarehouseProduct.destroy();
            res.status(200).json({ msg: 'HomeWareHouseProductDeleted' });
        } catch (error) {
            const errorMsg = error.details
                ? error.details.map(detail => detail.message).join(', ')
                : error.message || 'Error desconocido';

            logger.error('HomeWareHouseProductController->destroy: ' + errorMsg);
            res.status(500).json({ error: 'ServerError', details: errorMsg });
        }
    }
}

module.exports = HomeWarehouseProductController;
