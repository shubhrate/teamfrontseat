const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const Character = require('./models/Character');
const Diagram = require('./models/Diagram');
const Play = require('./models/Play');
const User = require('./models/User');

//Server connects to DB
require('dotenv/config');

mongoose.connect(
    process.env.DB_CONNECTION,
    { useNewUrlParser: true },
    () => console.log('connected to DB!')
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

function getOne(collection, query) {
    //finds a single instance that matches the query
    //query format: {name: Jane}, or {name: Jane, password: password}, or {id: JanesID}, or {name: Jane, id: JanesID}
    collection.findOne(query, function (err, result) {
        if (err) return handleError(err);
        return result;
    });
    console.log("one result found");
}

function getAll(collection, query) {
    //finds all instances that match the query
    collection.find(query, function (err, results) {
        if (err) return handleError(err);
        return results;
    });
    console.log("all results found");
}

function update(collection, query) {
    //update instance with query.id
    collection.updateOne(query.id, query);
    query.id.save(function (err, result) {
        if (err) console.log(err);
        return result;
    });
    console.log("instance updated");
}

function remove(collection, query) {
    collection.deleteOne(query);
    query.id.remove(function (err, result) {
        if (err) console.log(err);
        return result;
    });
    console.log("instance deleted");
}

function createInstance(collection, data) {
    var instance = new collection(data);
    instance.save(function (err, result) {
        if (err) console.log(err);
        return result;
    });
    console.log("instance added");
}

/* https://www.npmjs.com/package/express-ws */

app.use(function (req, res, next) {
    console.log('middleware');
    req.testing = 'testing';
    return next();
});

app.get('/', function(req, res, next) {
    console.log('get route', req.testing);
    res.end();
});

app.ws('/', function(ws, req) {
    ws.on('message', function(msgStr) {
        console.log("Client connected.");
    
        //log message from client
        console.log(msgStr);
    
        //returns an object that matching the string
        const msg = JSON.parse(msgStr)  
    
        //after JSON.parse:
        /*
            type: "getOne",
            collection: "users",
            data: {name: "Jane", password: "password", id: "487434"}
        */
        
        //reference collection into map of models
        const collectionMap = {
            'users': User,
            'characters': Character,
            'plays': Play,
            'diagrams': Diagram
        };
        const collection = collectionMap[msg.collection];
        
        var result = {};
    
        //command string - invokes a function based on command and collection
        if (msg.type=="getOne") {
            result = getOne(collection, msg.data);
        }
        if (msg.type=="getAll") {
            result = getAll(collection, msg.data);
        }
        if (msg.type=="post") {
            result = createInstance(collection, msg.data);
        }
        if (msg.type=="delete") {
            result = remove(msg.data.id);
        }
        if (msg.type=="update") {
            result = update(msg.data);
        }
    
        //add success flag - this is raising an error right now so commented out
        //result.success = "TRUE";
    
        //convert result back into string
        var finalResult = JSON.stringify(result);
        console.log(finalResult);

        //send result back
        ws.send(finalResult);
    });
    console.log('socket', req.testing);
    ws.on('close', () => {
        console.log("Client disconnected.");
    });
});

//Start Listening to Server:
app.listen(3000);


/* not sure how much of this we need anymore since no longer using webclient.js:

//Middlewares
//app.use(cors()); //allows front and backend to be in same domain?
//app.use(bodyParser.json());

//const clientRoute = require('./routes/webclient');

//app.use('/webclient', clientRoute);

//Routes:
//app.get('/webclient', function (req, res) {
//    res.send('We are on home');
//});

//app.onRecieve - when query recieved -> reply to client requests (STEP 2) 

*/