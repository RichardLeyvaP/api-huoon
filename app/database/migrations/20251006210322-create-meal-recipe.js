'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('meal_recipes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: 'PK – Identificador único de la asociación'
      },
      meal_entry_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'meal_entries',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        comment: 'FK → meal_entries.id'
      },
      recipe_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'recipes',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
        comment: 'FK → recipes.id – Receta consumida'
      },
      servings: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.00,
        comment: 'Porciones consumidas (ej: 1.0, 0.5, 1.25)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Clave única: no repetir la misma receta en una misma comida
    await queryInterface.addConstraint('meal_recipes', {
      fields: ['meal_entry_id', 'recipe_id'],
      type: 'unique',
      name: 'meal_recipes_meal_entry_id_recipe_id_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('meal_recipes', 'meal_recipes_meal_entry_id_recipe_id_unique');
    await queryInterface.dropTable('meal_recipes');
  }
};