const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
  "zupeetercm_zptrrrrlhdjnewtest", // db name
  "zupeetercm_zptrrrrlhdjnewtest", // username
  "Sudheer@123", // password
  {
    dialect: "mysql",
    host: "103.120.176.66",
    logging: false,
  }
);
module.exports = sequelize;
