"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Wish extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Relación con la tabla `people`
      Wish.belongsTo(models.Person, {
        foreignKey: "person_id",
        as: "person",
      });

      // Relación con la tabla `homes`
      Wish.belongsTo(models.Home, {
        foreignKey: "home_id",
        as: "home",
      });

      // Relación con la tabla `priorities`
      Wish.belongsTo(models.Priority, {
        foreignKey: "priority_id",
        as: "priority",
      });

      // Relación con la tabla `statuses`
      Wish.belongsTo(models.Status, {
        foreignKey: "status_id",
        as: "status",
      });

      // Relación consigo misma para subdeseos
      Wish.belongsTo(models.Wish, {
        foreignKey: "parent_id",
        as: "parent",
      });

      Wish.hasMany(models.Wish, {
        foreignKey: "parent_id",
        as: "children",
        onDelete: 'CASCADE',
        hooks: true, 
      });
    }
  }
  Wish.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true, // Indica que 'id' es la clave primaria
        autoIncrement: true, // Esto hace que el campo 'id' sea auto-incrementable
      },
      parent_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      person_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      home_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      priority_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      status_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      end: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Wish",
      tableName: "wishes",
      timestamps: true,
    }
  );
  return Wish;
};
