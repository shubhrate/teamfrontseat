const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
var cors = require('cors');


//Middlewares
app.use(cors()); //allows front and backend to be in same domain?
app.use(bodyParser.json());

const { use } = require('./routes/users'); //WHAT DOES THIS DO??
// const { use } = require('./routes/plays');
// const { use } = require('./routes/characters');

require('dotenv/config');



//Import Routes:
const usersRoute = require('./routes/users');
const playsRoute = require('./routes/plays');
const charactersRoute = require('./routes/characters');

app.use('/users', usersRoute);
app.use('/plays', playsRoute);
app.use('/characters', charactersRoute);

//Routes:
app.get('/', (req, res) => {
    res.send('We are on home');
});

//Server connects to DB
mongoose.connect(
    process.env.DB_CONNECTION,
    { useNewUrlParser: true },
    () => console.log('connected to DB!'),
    //test write and read using defined funcitons -- check mongoose documentation (STEP 1)
);

//test write and test read funcitons (mongoose.)

//Start Listening to Server:
app.listen(3000);
//app.onRecieve - when query recieved -> reply to client requests (STEP 2)
