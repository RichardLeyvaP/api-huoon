'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('shopping_list', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      person_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'people',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'ID de la persona que agrega el ítem'
      },
      home_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'homes',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'ID del hogar al que pertenece la lista'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Fecha programada para la compra'
      },
      person_home_warehouse_product_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'ID del registro en person_home_warehouse_product_id (opcional)'
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'ID del producto referenciado'
      },
      product_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Nombre del producto (denormalizado)'
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'URL de la imagen del producto'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Cantidad deseada'
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Motivo de la compra (ej: "se acabó", "evento")'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Pendiente',
        comment: 'Estado: pending, bought, cancelled'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });

    // Índices para optimizar consultas
    await queryInterface.addIndex('shopping_list', ['person_id'], { name: 'shopping_list_person_id_idx' });
    await queryInterface.addIndex('shopping_list', ['home_id'], { name: 'shopping_list_home_id_idx' });
    await queryInterface.addIndex('shopping_list', ['date'], { name: 'shopping_list_date_idx' });
    await queryInterface.addIndex('shopping_list', ['status'], { name: 'shopping_list_status_idx' });
    await queryInterface.addIndex('shopping_list', ['home_id', 'status'], { name: 'shopping_list_home_status_idx' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('shopping_list');
  }
};