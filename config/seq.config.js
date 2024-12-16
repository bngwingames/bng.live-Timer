const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
  "administrator_bngwingmllvv", // db name
  "administrator_bngwingmllvv", // username
  "ff*nC88X@CU1", // password
  {
    dialect: "mysql",
    host: "103.120.176.66",
    logging: false,
  }
);
module.exports = sequelize;
