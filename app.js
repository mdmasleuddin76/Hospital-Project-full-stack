const express = require("express");
const ejs = require("ejs");
const app = express();
const path = require("path");
const morgan = require("morgan");
const dotenv = require("dotenv");
const sessions = require("express-session");
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const sql = require("mysql");
const flash=require("connect-flash");
const connection = require("./connection");
//Hiding Credentials
dotenv.config({ path: "config.env" });
//session middleware
app.use(
  sessions({
    secret: "thisismysecrctekey",
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
    resave: false,
  })
);
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(flash());
//This middleware will allow us to pull req.body.<params>
app.use(express.json());
// log requests
app.use(morgan("tiny"));
// set view engine
app.set("view engine", "ejs");
//Load Static Files
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("frontpage");
});
app.get("/contact", (req, res) => {
  res.render("contact");
});
app.get("/loginsignup", (req, res) => {
  res.render("loginsignup");
});
app.get("/appointment", (req, res) => {
  res.render("appointment");
});
app.get("/adminpage", (req, res) => {
  res.render("adminpage");
});
app.post("/signup", (req, res) => {
  let admincode = req.body.admincode;
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;

  connection.connect(function (err) {
    if (err) {
      console.log(err);
    }
    // checking user already registered or no
    connection.query(
      `SELECT * FROM authentication WHERE username = '${username}' AND password  = '${password}'`,
      function (err, result) {
        if (err) {
          console.log(err);
        }
        if (Object.keys(result).length > 0) {
          res.render("registration_failed");
        } else {
          //creating user page in userPage function
          function userPage() {
            // We create a session for the dashboard (user page) page and save the user data to this session:
            req.session.user = {
              admincode: admincode,
              username: username,
              email: email,
              password: password,
            };

            res.render("adminpage",{username:username});
          }
          // inserting new user data
          let sql = `INSERT INTO authentication (admincode, username, email, password) VALUES ('${admincode}', '${username}', '${email}', '${password}')`;
          connection.query(sql, function (err, result) {
            if (err) {
              console.log(err);
            } else {
              // using userPage function for creating user page
              userPage();
            }
          });
        }
      }
    );
  });
});
app.post("/signin", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  connection.connect(function (err) {
    if (err) {
      console.log(err);
    }
    //get user data from MySQL database
    connection.query(
      `SELECT * FROM authentication WHERE email = '${email}' AND password = '${password}'`,
      function (err, result) {
        if (err) {
          console.log(err);
        }
        // creating userPage function to create user page
        function userPage() {
          // We create a session for the dashboard (user page) page and save the user data to this session:
          req.session.user = {
            admincode: result[0].admincode, // get MySQL row data
            username: result[0].username, // get MySQL row dataa
            email: email,
            password: password,
          };
          // console.log(req)
          // console.log(result[0].username);
          res.render("adminpage",{username: result[0].username});
        }

        if (Object.keys(result).length > 0) {
          userPage();
        } else {
          res.render("login_failed");
        }
      }
    );
  });
});
app.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/loginsignup");
});
// Appointment Route
app.post("/appointment", (req, res) => {
  let name = req.body.name;
  let phone = req.body.phone;
  let email = req.body.email;
  let age = req.body.age;
  let gender = req.body.gender;
  let department = req.body.department;
  let date = req.body.date;
  let sql = `INSERT INTO appointment (name, phone, email, age, gender,department,date) VALUES ("${name}", "${phone}", "${email}", "${age}","${gender}","${department}","${date}")`;
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("record inserted");
    // console.log(result);
    res.render("appointmentsucc",{id:result.insertId})
  });
});
// contactus route table
app.post("/contact", (req, res) => {
  let name = req.body.username;
  let phone = req.body.phone;
  let email = req.body.email;
  let message = req.body.message;
  let sql = `INSERT INTO contactus (name, phone, email, message) VALUES ("${name}", "${phone}", "${email}", "${message}")`;
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("message sent");
    res.redirect("/contact");
  });
});
app.get("/signin/add-medicine",(req,res)=>{
  // res.render("adminpage");
})
app.post("/signin/add-medicine", (req, res) => {
  let name = req.body.name;
  let manufacturer = req.body.manufacturer;
  let quantity = req.body.quantity;
  let dateofexp = req.body.dateofexp;
  let sql = `INSERT INTO medicine (name, manufacturer, quantity, dateofexp) VALUES ("${name}", "${manufacturer}", "${quantity}", "${dateofexp}")`;
  connection.query(sql, function (err, result) {
    if (err) throw err;
    res.send("Medicine Added SuccessFully");
    // user.username 
    // res.render("adminpage",{username:user.username});
    // res.send("Medicine Inserted SuccessFully");
    console.log(req);
    // res.redirect("/signin/add-medicine");
  });
});
app.post("/signin/delete-medicine", function(req, res) {
  let name= req.body.name;
    let sql = 'DELETE FROM medicine WHERE name = ?';
    connection.query(sql, [name], function (err, data) {
    if (err) throw err;
    res.send("Deleted SuccesFully");
    console.log(req);
    // res.render("adminpage",{username:req.session.user.});
  });
});
//All patient route
app.get("/signin/all-patients",(req,res)=>{
  connection.query('SELECT * FROM appointment ORDER BY appointmentid desc', function (err, rows) {
    if (err) {
      throw err;
    } else {
      res.render('patient_list', { users: rows });
    }
  });
});
// All medicine route 
app.get("/signin/all-medicines",(req,res)=>{
  connection.query('SELECT * FROM medicine ORDER BY name desc', function (err, rows) {
    if (err) {
      throw err;
    } else {
      res.render('medicine_list', { users: rows });
    }
  })
})


//  Listening the Server 
app.listen(3000, (req, res) => {
  console.log("Server is Listening on Port 3000");
});
