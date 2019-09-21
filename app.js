const express = require('express')
const helmet = require('helmet')
const bodyParser  = require('body-parser');
require('dotenv').config()
//models
const users = require('./models/users');
const user_logs = require('./models/user_logs');

// for passwords
const bcrypt = require('bcrypt');
const saltRounds = 12;


const app = express()
const port = process.env.PORT;

// database
const Pool = require('pg').Pool
const pool = new Pool({
	//host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_URL,
  port: 5432,
})

app.use(helmet())
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// middleware
app.use(function middleware(req,res,next) {
  console.log(req.method + " " + req.path + " - " + req.ip);
  next();
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

// this will be the login page
app.get('/', function(req,res,done) {
	res.json({"message": "hello!"}); // this will be changed later
})

// this will be the login page
app.get('/about', function(req,res,done) {
	res.send({"message": "hello!"}); // this will be changed later
})

app.post('/login', function(req,res,done) {
	var name = req.body.name || "";
	var email = req.body.email;
	var password = req.body.password || "";
	pool.query('SELECT * FROM users WHERE email = $1', [email], (error, results) => {
    if (error) {
      console.log(error)
      throw error;
    }
    console.log(results.rows.length);
    if (results.rows.length == 0) {
    	pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, password], function(error, results) {
	    if (error) {
	      console.log(error);
	      throw error;
	    }
    	res.send(results.rows)
    })
    } else {
    	res.send(results.rows);
    }  
  })
})

// user stuff
app.route('/user').post(function(req,res,done) {
	// TODO
	// create the user: need the email, username, and password; need to hash password
	// var name = req.body.name;
	// var email = req.body.email;
	// var passwordHash;
	// // bcrypt.hash(req.body.password, saltRounds,function(err,hash) {
	// // 	if (err) return done(err);
	// // 	passwordHash = hash;
	// // });

	// // save the user
	// pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, passwordHash], (error, results) => {
 //    if (error) {
 //      throw error
 //    }
 //    response.status(201).send(`User added with ID: ${result.insertId}`)
 //  })

}).get(function(req,res,done) {
	var id = req.query.id;
	pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    res.status(200).json(results.rows)
  })
});



app.listen(port, () => console.log(`Example app listening on port ${port}!`))
