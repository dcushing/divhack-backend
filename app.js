const express = require('express')
const helmet = require('helmet')
const bodyParser  = require('body-parser');
const cors = require('cors');
require('dotenv').config()
const request = require("request");

//models
const users = require('./models/users');
const user_logs = require('./models/user_logs');

const app = express()
const port = process.env.PORT;

// database
const pg = require('pg')
pg.defaults.connectionString = process.env.DATABASE_URL + "?ssl=true";
const pool = new pg.Pool({
	host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_URL,
  port: 5432,
})

app.use(helmet())
app.options('*', cors())

//var postCode1 = "78704";
//var postCode2 = "08301";
//var unit = 'mi';

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
app.route('/user').get(function(req,res,done) {
	var id = req.query.id;
	pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    res.status(200).json(results.rows)
  })
});

app.post('/input', (req,res,done) => {

    var currentStreet = req.body.currentStreet;
    console.log(currentStreet);
    currentStreet.replace(/ /g,"%20");
    var currentCity = req.body.currentCity;
    var currentState = req.body.currentState;
    var address1 = currentStreet + "%20" + currentCity + "%20" + currentState;
    var street = req.body.street; 
    street.replace(/ /g,"%20");
    var city = req.body.city;
    var state = req.body.state;
    var address2 = street + "%20" + city + "%20" + state;

/*
var CurrentStreet = "604 Brazos St";
var CurrentCity = "Austin";
var CurrentState = "TX";
CurrentStreet.replace(/ /g,"%20");
var address1 = CurrentStreet + "%20" + CurrentCity + "%20" + CurrentState;
var Street = "1 Microsoft Way" 
Street.replace(/ /g,"%20");
var city = "Redmond";
var state = "WA";
var address2 = Street + "%20" + city + "%20" + state;
*/


    var url = "http://dev.virtualearth.net/REST/V1/Routes/Driving?waypoint.1=" 
    + address1 + "%2Cwa&waypoint.2=" + address2 + "%2Cwa&avoid=minimizeTolls&key="
     + process.env.BING_API_KEY;

    var url2 = "http://dev.virtualearth.net/REST/V1/Routes/Transit?waypoint.1=" 
    + address1 + "%2Cwa&waypoint.2=" + address2 + "%2Cwa&avoid=minimizeTolls&key="
     + process.env.BING_API_KEY;

    var urls = [url, url2];

    request(url, (error, response, body) => {
		var data = JSON.parse(body);
		if(!error && response.statusCode == 200){
            var distancekm = data.resourceSets[0].resources[0].travelDistance;
            var preJson = {
                "car_distance": distancekm
            }
            
            var jsonStr = JSON.stringify(preJson)
            request.post({
                "headers":{ 
                    "Content-Type": "application/json"
                },
                "url": "http://green-foot-app.herokuapp.com",
                "body": jsonStr
            }, function(error, response, body){
                console.log(body)
                res.send(body);
            })
		}
    });
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))