'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recipe_products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: 'PK – Identificador único del ingrediente en la receta'
      },
      recipe_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'recipes',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        comment: 'FK → recipes.id – Receta a la que pertenece este ingrediente'
      },
      product_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        comment: 'FK → products.id – Producto (ingrediente) usado'
      },
      person_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'people',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        comment: 'FK → people.id – Persona creadora de la receta'
      },
      quantity: {
        type: Sequelize.DECIMAL(8, 3),
        allowNull: false,
        comment: 'Cantidad usada del producto (ej: 150.000)'
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Unidad de medida: g, ml, unidad, taza, cda, cdta, kg, L'
      },
      calories_per_unit: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Calorías por unidad del producto'
      },
      protein_per_unit: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Proteína (g) por unidad'
      },
      carbs_per_unit: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Carbohidratos (g) por unidad'
      },
      fats_per_unit: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Grasas (g) por unidad'
      },
      fiber_per_unit: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Fibra (g) por unidad'
      },
      sugar_per_unit: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Azúcar (g) por unidad'
      },
      saturated_fats_per_unit: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Grasas saturadas (g) por unidad'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: 'Fecha de creación del registro'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: 'Última actualización del registro'
      }
    });

    await queryInterface.addConstraint('recipe_products', {
      fields: ['recipe_id', 'product_id'],
      type: 'unique',
      name: 'recipe_products_recipe_id_product_id_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('recipe_products', 'recipe_products_recipe_id_product_id_unique');
    await queryInterface.dropTable('recipe_products');
  }
};