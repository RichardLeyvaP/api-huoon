'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('person_home_warehouse_products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      person_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'people', // El nombre de la tabla de referencia también debe ser en minúsculas
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'homes',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      warehouse_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'warehouses',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'statuses',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      unit_price: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: true
      },
      total_price: {
        type: Sequelize.DECIMAL(16, 2),
        allowNull: true
      },
      purchase_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      purchase_place: {
        type: Sequelize.STRING,
        allowNull: true
      },
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true
      },
      additional_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      maintenance_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      frequency: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('person_home_warehouse_products');
  }
};