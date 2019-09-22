const express = require('express')
const helmet = require('helmet')
const bodyParser  = require('body-parser');
const request = require("request");
//models
const users = require('./models/users');
const user_logs = require('./models/user_logs');

const app = express()
const port = 3000
require('dotenv').config()
// const { Client } = require('pg')
// const client = new Client()
// await client.connect()


app.use(helmet())

//var postCode1 = "78704";
//var postCode2 = "08301";
//var unit = 'mi';

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', function(req,res,done) {
	res.json({"message": "hello!"});
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
    });
});



app.listen(port, () => console.log(`Example app listening on port ${port}!`))
