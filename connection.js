
const mysql =require("mysql2");
const dotenv=require("dotenv");
dotenv.config( { path : 'config.env'} );

let connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect(function(err) {
    if (err) 
     throw err
        console.log("Database connected!");

});
module.exports = connection;