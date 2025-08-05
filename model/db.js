// const mysql2 = require('mysql2');
// require("dotenv").config();
// const connection = mysql2.createPool({
//   host: process.env.DB_HOST ,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });
// module.exports = connection.promise();


const mysql2 = require("mysql2");
require("dotenv").config();
// const fs = require("fs"); 

const connection = mysql2.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // Add this line for TiDB port
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true, // Quick method without CA cert
    // For secure method with CA cert:
    // ca: fs.readFileSync('./certs/ca.pem')
  },
});

module.exports = connection.promise();
