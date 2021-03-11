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

/* https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose */

function getOne(collection, query, ws) {
    //finds a single instance that matches the query
    //query format: {name: Jane}, or {name: Jane, password: password}, or {id: JanesID}, or {name: Jane, id: JanesID}
    collection.findOne(query, function (err, result) {
        if (err) return handleError(err);
        console.log(err, result);
        //callback function accesses ws via closure
        respondToSocket(result, ws);
    });
}

function getAll(collection, query, ws) {
    //finds all instances that match the query
    collection.find(query, function (err, result) {
        console.log(err, result);
        if (err) return handleError(err);
        respondToSocket(result, ws);
    });
}

function update(collection, query, ws) {
    //update instance with query.id
    collection.updateOne(query.id, query);
    query.id.save(function (err) {
        if (err) console.log(err);
        respondToSocket({updated: true});
    });
    console.log("instance updated");
    return {updated: true};
}

function remove(collection, query, ws) {
    collection.deleteOne(query);
    query.id.remove(function (err) {
        if (err) console.log(err);
        respondToSocket({deleted: true});
    });
    console.log("instance deleted");
    return {deleted: true};
}

function createInstance(collection, data, ws) {
    let instance = new collection(data);
    instance.save(function (err) {
        if (err) console.log(err);
        respondToSocket({added: true});
    });
    console.log("instance added");
    return {added: true};
}

/* https://www.npmjs.com/package/express-ws */

function respondToSocket(msg, ws) {
    console.log(msg);
    const finalResponse = JSON.stringify(msg);
    ws.send(finalResponse);
}

app.use(function (req, res, next) {
    console.log('middleware');
    req.testing = 'testing';
    return next();
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
        
        const requestTypes = {
            getOne,
            getAll,
            update,
            remove,
            createInstance
        };

        var collection = collectionMap[msg.collection];
        if(!collection) {
            //Here's where to deal with errors
        }

        //command string - invokes a function based on command and collection
        if (requestTypes[msg.type]) {
            requestTypes[msg.type](collection, msg.data, ws);
        } else {
            throw new Error("Invalid message type");
        }
    });
    console.log('socket', req.testing);
    ws.on('close', () => {
        console.log("Client disconnected.");
    });
});

//Start Listening to Server:
app.listen(3000);
