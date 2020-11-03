const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const { use } = require('./routes/users');
require('dotenv/config');



//Import Routes:
const usersRoute = require('./routes/users')

app.use('/users', usersRoute);

//Routes:
app.get('/', (req, res) => {
    res.send('We are on home');
});

//Connect to DB
mongoose.connect(
    process.env.DB_CONNECTION,
    { useNewUrlParser: true },
    () => console.log('connected to DB!')
);

//Start Listening to Server:
app.listen(3000);