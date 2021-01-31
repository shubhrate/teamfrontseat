const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
var cors = require('cors');


var server = app.listen(9003);
//var io = require('socket.io').listen(server);
var io = require('socket.io')(server);
app.set("io", io);
//anywhere in routes where we have access to the app object, we can get it with:
//var io = app.get("io");
//do we have access to the app object in routes?

//initialize the socketio module to pass it the io instance:
require('./mysocket.js')(io);

//Middlewares
app.use(cors()); //allows front and backend to be in same domain?
app.use(bodyParser.json());
//makes io available as req.io in all request handlers
app.use(function(req, res, next) {
    req.io = io;
    next();
});
//then in any express route handler, we can use req.io.emit(...)

const { use } = require('./routes/users'); //WHAT DOES THIS DO??
// const { use } = require('./routes/plays');
// const { use } = require('./routes/characters');

require('dotenv/config');



//Import Routes:
const usersRoute = require('./routes/users');
const playsRoute = require('./routes/plays');
const charactersRoute = require('./routes/characters');

//app.use('/users', usersRoute);
app.use(require("/users")(io));
//app.use('/plays', playsRoute);
app.use(require("/plays")(io));
//app.use('/characters', charactersRoute);
app.use(require("/characters")(io));

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

//test write and test read functions (mongoose.)

//Start Listening to Server:
app.listen(9003);
//app.onRecieve - when query recieved -> reply to client requests (STEP 2)

module.exports = (io) => {
    console.log('IO: ', io);
    io.on('connect', socket => {
        //handle various socket connections here
    });

    //put any other code that wants to use the io variable
}