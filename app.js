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
  ssl: true
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

// get trips for users or post a trip for a user
app.route('/user/:id').get(function(req,res,done) {
	var id = req.params.id;
	pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
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
		    res.send(totalCo2kg.toFixed(3))
		})
    }
  })
}).post(function(req,res,done) {
	var id = req.params.id;
	var date = new Date();
	 var co2kg = req.body.co2kg || 0;
	 var mileage = req.body.mileage || 0;
	 var transport_mode = req.body.transport_mode || "";
	 console.log(id);
	pool.query('INSERT INTO user_log (user_id, date, co2kg, mileage, transport_mode) VALUES ($1, $2, $3, $4, $5)', [id, date, co2kg, mileage, transport_mode], function(error, results) {
	    if (error) {
	      console.log(error);
	      throw error;
	    }
	    //console.log(results);
	    //console.log(results.rows);
    	res.send(results.rows)
    })
	// pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
 //    if (error) {
 //      throw error
 //    }
 //    if (results.rows.length == 0) {
 //    	res.status(404)
 //    } else {
 //    	console.log
 //    	var user_id = results.rows[0].id;
 //    	var date = new Date();
 //    	var co2kg = req.query.co2kg || 0;
 //    	var mileage = req.query.mileage || 0;
 //    	var transport_mode = req.body.transport_mode || "";
 //    	console.log(user_id);
 //    	console.log(date);
 //    	console.log(co2kg);
 //    	console.log(mileage);
 //    	console.log(transport_mode);
 //    	pool.query('INSERT INTO user_log (user_id, date, co2kg, mileage, transport_mode) VALUES ($1, $2, $3, $4, $5)', [user_id, date, co2kg, mileage, transport_mode], function(error, results) {
	//     if (error) {
	//       console.log(error);
	//       throw error;
	//     }
	//     console.log(results.rows);
 //    	res.send(results.rows)
 //    })
 //    }
 //  })
})

var CurrentStreet = "604 Brazos St";
var CurrentCity = "Austin";
var CurrentState = "TX";
CurrentStreet.replace(/ /g,"%20");
var Address1 = CurrentStreet + "%20" + CurrentCity + "%20" + CurrentState;
var Street = "1 Microsoft Way" 
Street.replace(/ /g,"%20");
var city = "Redmond";
var state = "WA";
var Address2 = Street + "%20" + city + "%20" + state;

app.get('/input', (req,res,done) => {
    var url = "http://dev.virtualearth.net/REST/V1/Routes/Driving?waypoint.1=" + Address1 + "%2Cwa&waypoint.2=" + Address2 + "%2Cwa&avoid=minimizeTolls&key=" + process.env.BING_API_KEY;
    var url2 = "http://dev.virtualearth.net/REST/V1/Routes/Transit?waypoint.1=" + Address1 + "%2Cwa&waypoint.2=" + Address2 + "%2Cwa&avoid=minimizeTolls&key=" + process.env.BING_API_KEY;
    request(url, (error, response, body) => {
		const data = JSON.parse(body);
		if(!error && response.statusCode == 200){
            var distance = data.resourceSets[0].resources[0].travelDistance;
            console.log(distance);
		}
    });
    request(url2, (error, response, body) => {
		const data2 = JSON.parse(body);
		if(!error && response.statusCode == 200){
            var distance2 = data.resourceSets[0].resources[0].travelDistance;
            console.log(distance2);
		}
	})
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))