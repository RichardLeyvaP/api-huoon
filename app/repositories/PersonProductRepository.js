const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Person, Warehouse, HomePerson, Home, Product, PersonHomeWarehouseProduct, Status, Category, sequelize } = require('../models');
const logger = require('../../config/logger');

class PersonProductRepository {
    async findAll() {
        return await PersonHomeWarehouseProduct.findAll({
            include: [
                {
                    model: Home,
                    as: 'home', // Asociación con el modelo Home
                    attributes: ['id', 'name'] // Ajusta los atributos de Home que quieres devolver
                },
                {
                    model: Person,
                    as: 'person', // Asociación con el modelo Person
                    attributes: ['id', 'name', 'email'] // Ajusta los atributos de Person según sea necesario
                },
                {
                    model: Warehouse,
                    as: 'warehouse', // Asociación con el modelo Warehouse
                    attributes: ['id', 'title'] // Ajusta los atributos de Warehouse según sea necesario
                },
                {
                    model: Product,
                    as: 'product', // Asociación con el modelo Product
                    attributes: ['id', 'name'] , // Ajusta los atributos de Product según sea necesario
                    include: [
                       { 
                        model: Category,
                        as: 'category', // Asociación con el modelo Category
                        attributes: ['id', 'name'], // Ajusta los atributos de Category según sea necesario
                        }
                    ]
                },
                {
                    model: Status,
                    as: 'status', // Asociación con el modelo Status
                    attributes: ['id', 'name'] // Ajusta los atributos de Status según sea necesario
                }
            ]
        });
    }

    async personHomeWarehouseProducts(body){
        return await PersonHomeWarehouseProduct.findAll({
            where: {
                home_id: body.home_id,
                warehouse_id: body.warehouse_id
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
                    attributes: ['id', 'name', 'category_id'], // Datos del producto
                    include: [
                        {
                            model: Category,
                            as: 'category', // Relación con Category
                            attributes: ['id','name']
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
    }

    async findById(id) {
        return await PersonHomeWarehouseProduct.findByPk(id, {
            include: [
                {
                    model: Home,
                    as: 'home', // Asociación con el modelo Home
                    attributes: ['id', 'name'] // Ajusta los atributos de Home que quieres devolver
                },
                {
                    model: Person,
                    as: 'person', // Asociación con el modelo Person
                    attributes: ['id', 'name', 'email'] // Ajusta los atributos de Person según sea necesario
                },
                {
                    model: Warehouse,
                    as: 'warehouse', // Asociación con el modelo Warehouse
                    attributes: ['id', 'title'] // Ajusta los atributos de Warehouse según sea necesario
                },
                {
                    model: Product,
                    as: 'product', // Asociación con el modelo Product
                    attributes: ['id', 'name'], // Ajusta los atributos de Product según sea necesario
                    include: [
                       { 
                        model: Category,
                        as: 'category', // Asociación con el modelo Category
                        attributes: ['id', 'name'], // Ajusta los atributos de Category según sea necesario
                        }
                    ]
                },
                {
                    model: Status,
                    as: 'status', // Asociación con el modelo Status
                    attributes: ['id', 'name'] // Ajusta los atributos de Status según sea necesario
                }
            ],
        });
    }

    async create(body, file, t, person_id) {
        const { home_id, warehouse_id, product_id, status_id, unit_price, total_price, quantity, purchase_date, 
            purchase_place, expiration_date, brand, additional_notes, maintenance_date, 
            due_date, frequency, type, image, category_id, name} = body;
        try {
            // Asociar el producto al almacén y al hogar en `person_home_warehouse_product`
            const [personHomeWarehouseProduct, created] = await PersonHomeWarehouseProduct.findOrCreate({
                where: {
                    warehouse_id: warehouse_id,
                    home_id: home_id,
                    person_id: person_id,
                    product_id: product_id
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
                    image: 'personHomeWarehouseProducts/default.jpg'
                },
                transaction: t
            });
    
            // Copiar la imagen a la nueva carpeta con el ID de `personHomeWarehouseProduct`
            if (file && created) {
                const extension = path.extname(req.file.originalname);
                const newImagePath = `personHomeWarehouseProducts/${personHomeWarehouseProduct.id}${extension}`;
                const destinationPath = path.join(__dirname, '..', '..', 'public', newImagePath);
    
                try {
                    // Copiar el archivo desde `products` a la carpeta `images` con el ID de `personHomeWarehouseProduct`
                    const tempPath = path.join(__dirname, '..', '..', 'public', filename);
                    await fs.promises.copyFile(tempPath, destinationPath);
    
                    // Actualizar el registro de `personHomeWarehouseProduct` con la nueva ruta
                    await personHomeWarehouseProduct.update({ image: newImagePath }, { transaction: t });
    
                } catch (err) {
                    logger.error('Error al copiar la imagen a la carpeta de destino: ' + err.message);
                    throw err; // Esto permitirá que el catch lo maneje y haga rollback
                }
            }
        return personHomeWarehouseProduct;
    } catch (err) {
        logger.error(`Error en PersonProductRepository->store: ${err.message}`);
        throw err; // Propagar el error para que el rollback se ejecute
    }
    }

    async update(personHomeWarehouseProduct, body, file, t) {
        // Lista de campos permitidos para actualizar
        const fieldsToUpdate = [
            'home_id', 'warehouse_id', 'product_id', 'status_id', 'unit_price', 'total_price',
                'quantity', 'purchase_date', 'expiration_date', 'purchase_place', 'brand', 'additional_notes',
                'maintenance_date', 'due_date', 'frequency', 'type', 'image'
        ];
        try{

        // Filtrar campos en req.body y construir el objeto updatedData
        const updatedData = Object.keys(body)
            .filter(key => fieldsToUpdate.includes(key) && body[key] !== undefined)
            .reduce((obj, key) => {
                obj[key] = body[key];
                return obj;
            }, {});

        // Procesar la imagen si se sube una nueva
        if (file) {
            const extension = path.extname(file.originalname);
            const newFilename = `personHomeWarehouseProducts/${task.id}${extension}`;

            // Eliminar la imagen anterior si no es la predeterminada
            if (personHomeWarehouseProduct.image && personHomeWarehouseProduct.image !== 'personHomeWarehouseProducts/default.jpg') {
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

            // Guardar la nueva ruta de la imagen en updatedData
            updatedData.image = `${newFilename}`;
        }
        
        // Actualizar la tarea solo si hay datos para cambiar
        if (Object.keys(updatedData).length > 0) {
            await personHomeWarehouseProduct.update(updatedData, {transaction: t});
            logger.info(`Task actualizada exitosamente (ID: ${personHomeWarehouseProduct.id})`);
        }

        return personHomeWarehouseProduct;
    } catch (err) {
        logger.error(`Error en PersonProductRepository->update: ${err.message}`);
        throw err; // Propagar el error para que el rollback se ejecute
    }
    }

    async delete(personHomeWarehouseProduct) {
         // Verificar y eliminar la imagen si no es la predeterminada
         if (personHomeWarehouseProduct.image && personHomeWarehouseProduct.image !== 'personHomeWarehouseProducts/default.jpg') {
            const oldImagePath = path.join(__dirname, '../../public', personHomeWarehouseProduct.image);
            try {
                await fs.promises.unlink(oldImagePath);
                logger.info(`Imagen anterior eliminada: ${oldImagePath}`);
            } catch (error) {
                logger.error(`Error al eliminar la imagen anterior: ${error.message}`);
            }
        }

        const product = await Product.findByPk(personHomeWarehouseProduct.product_id);

        if (product.image && product.image !== 'products/default.jpg') {
            const oldImagePath = path.join(__dirname, '../../public', product.image);
            try {
                await fs.promises.unlink(oldImagePath);
                logger.info(`Imagen anterior eliminada: ${oldImagePath}`);
            } catch (error) {
                logger.error(`Error al eliminar la imagen anterior: ${error.message}`);
            }
        }

        
        // Eliminar el registro de la tabla
        const personHomeWarehouseProductDelete =  await personHomeWarehouseProduct.destroy();
        logger.info(`Registro eliminado de PersonHomeWarehouseProduct con ID ${personHomeWarehouseProduct.id}`);  
        await personHomeWarehouseProduct.destroy();          
        logger.info(`Registro eliminado de Product con ID ${product.id}`);
        // Eliminar el registro de la tabla
        await product.destroy();

        return personHomeWarehouseProductDelete;

    }
}

module.exports = new PersonProductRepository();
