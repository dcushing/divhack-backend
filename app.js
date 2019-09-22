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
  connectionString: process.env.DATABASE_URL,
  port: 5432,
  //ssl: true
})

app.use(helmet())
app.options('*', cors())

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
	    res.sendStatus(200);
    	//res.send(results.rows)
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

// get trips for users or post a trip for a user
app.route('/user/:email').get(function(req,res,done) {
	var id = req.params.id;
	pool.query('SELECT * FROM users WHERE email = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    if (results.rows.length == 0) {
    	res.status(404)
    } else {
    	user_id = results.rows[0].id
    	pool.query('SELECT * FROM user_log WHERE user_id = $1', [user_id], (error, results) => {
		    if (error) {
		      throw error
		    }
		    var totalCo2kg = 0;
		    if (results.rows.length == 0) {
		    	
		    } else {
		    	var totalCo2kg = 0;
		    	for (var x = 0; x < results.rows.length; x++) {
		    		var co2kg = results.rows[x].co2kg;
		    		totalCo2kg += parseFloat(co2kg);
		    	}
		    }
		    //res.send(totalCo2kg.toFixed(3))
		    res.send(305.43)
		})
    }
  })
}).post(function(req,res,done) {
	var id = req.params.id;
	var date = new Date();
	var co2kg = req.body.co2kg || 0;
	var mileage = req.body.mileage || 0;
	var transport_mode = req.body.transport_mode || "";
 res.sendStatus(204);
})


app.post('/input', (req,res,done) => {

    var currentStreet = req.body.currentStreet;
    console.log(currentStreet);
    currentStreet.replace(/ /g,"%20");
    console.log(currentStreet);
    currentStreet = "604%20Brazos%20St"
    var currentCity = req.body.currentCity;
    var currentState = req.body.currentState;
    var address1 = currentStreet + "%20" + currentCity + "%20" + currentState;
    console.log(address1);
    var street = req.body.street; 
    street.replace(/ /g,"%20");
    street = "1%20Microsoft%20Way";
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
     console.log(url);

    var url2 = "http://dev.virtualearth.net/REST/V1/Routes/Transit?waypoint.1=" 
    + address1 + "%2Cwa&waypoint.2=" + address2 + "%2Cwa&avoid=minimizeTolls&key="
     + process.env.BING_API_KEY;
     console.log(url2);

    var urls = [url, url2];
    //var url = 'https://uplift-paywall.herokuapp.com/api/v3/status';

    request(url, (error, response, body) => {
		var data = JSON.parse(body);
		if(!error && response.statusCode == 200){
            var distancekm = data.resourceSets[0].resources[0].travelDistance;
            var preJson = {
                "car_distance": 2122,
                "bus_distance": 2122
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