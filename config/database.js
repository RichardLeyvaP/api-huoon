require('dotenv').config()

module.exports = {
  //configuracion de la db
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_DATABASE || "database_development",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_DIALECT || "mysql",

    //Configurar seeders
    seederStorage: "sequelize",
    seederStorageTableName: "seeds",

    //Configuracion de Migrations
    migrationStorage: "sequelize",
    migrationStorageTableName : "migrations"
}
