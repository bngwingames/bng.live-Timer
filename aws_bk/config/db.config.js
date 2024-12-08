const mysql = require("mysql2");
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = require("../dbconnections");
// Create a connection to the database
const connection = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  multipleStatements: true,
});

// open the MySQL connection
connection.connect((error) => {
  if (error) {
    console.log(error);
    return;
  }
  console.log("Successfully connected to the database.");
});

module.exports = connection;
