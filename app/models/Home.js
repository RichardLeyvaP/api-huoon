'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Home extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Home.belongsTo(models.HomeType, {
        foreignKey: 'home_type_id',
        as: 'homeType'
      });

      Home.belongsToMany(models.Person, {
        through: 'home_person',
        foreignKey: 'home_id',
        otherKey: 'person_id',
        as: 'people',  // Alias para la relación
      });
    }
  }
  Home.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    home_type_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'HomeType', // Nombre de la tabla de usuarios (asegúrate de que esté bien)
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    residents: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    geo_location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Activa',
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Home',
    tableName: 'homes',
    timestamps: true, // Esto habilita createdAt y updatedAt
  });
  return Home;
};