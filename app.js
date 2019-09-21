const express = require('express')
const helmet = require('helmet')
const bodyParser  = require('body-parser');
//mpde;s
const users = require('./models/users');
const user_logs = require('./models/user_logs');


const app = express()
const port = 3000
require('dotenv').config()
// const { Client } = require('pg')
// const client = new Client()
// await client.connect()


app.use(helmet())


app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', function(req,res,done) {
	res.json({"message": "hello!"});
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
