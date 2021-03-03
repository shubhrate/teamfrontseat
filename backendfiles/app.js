const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const ws = require('express-ws')(app);


//Middlewares
app.use(cors()); //allows front and backend to be in same domain?
app.use(bodyParser.json());

require('dotenv/config');

//Import Routes:
/*
const usersRoute = require('./routes/users');
const playsRoute = require('./routes/plays');
const charactersRoute = require('./routes/characters');
*/
//SORRY: ONLY ONE ROUTE NOW, FOR ALL WEBSOCKET CONNECTIONS.
//Best we can hope for in terms of organization is separate routes for
//connections from web client vs. vive tracker client.

const clientRoute = require('./routes/webclient');

//TODO: Unless there's a way to use these routes (and please tell me if there
//is, bundling them as I've done feels somewhat inelegant), they should be
//removed. This goes also for the imports above.
/*
app.use('/users', usersRoute);
app.use('/plays', playsRoute);
app.use('/characters', charactersRoute);
*/

app.use('/webclient', clientRoute);

//Routes:
app.get('/', (req, res) => {
    res.send('We are on home');
});

//Server connects to DB
mongoose.connect(
    process.env.DB_CONNECTION,
    { useNewUrlParser: true },
    () => console.log('connected to DB!')
    //test write and read using defined functions -- check mongoose documentation (STEP 1)
);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//test write and test read functions (mongoose.)

//Start Listening to Server:
app.listen(3000);
//app.onRecieve - when query recieved -> reply to client requests (STEP 2)