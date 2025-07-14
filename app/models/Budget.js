'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Budget extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
       Budget.belongsTo(models.Person, {
        foreignKey: 'person_id',
        as: 'person',
      });

      Budget.belongsTo(models.Home, {
        foreignKey: 'home_id',
        as: 'home',
      });

      Budget.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category',
      });
      
      Budget.hasMany(models.Finance, {
        foreignKey: "budget_id",
        as: "finances", // Opcional: alias para eager loading
      });
    }
  }
  Budget.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      person_id: {
        type: DataTypes.BIGINT,
        references: {
          model: "Person",
          key: "id",
        },
        onDelete: "CASCADE",
        allowNull: false,
      },
      home_id: {
        type: DataTypes.BIGINT,
        references: {
          model: "Home",
          key: "id",
        },
        onDelete: "CASCADE",
        allowNull: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Category",
          key: "id",
        },
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        allowNull: false,
      },
      used_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      budget_type: {
        type: DataTypes.STRING(50), //ENUM("personal", "household"),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50), //ENUM('active', 'inactive', 'completed', 'exceeded'),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(20),
        defaultValue: "USD",
      },
    },
    {
      sequelize,
      modelName: "Budget",
      tableName: "budgets",
      timestamps: true,
    }
  );
  return Budget;
};