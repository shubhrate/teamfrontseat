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

function getOne(collection, query) {
    //finds a single instance that matches the query
    //query format: {name: Jane}, or {name: Jane, password: password}, or {id: JanesID}, or {name: Jane, id: JanesID}
    let response = collection.findOne(query, function (err, result) {
        if (err) return handleError(err);
        return result;
    });
    console.log("one result found");
    return response;
}

function getAll(collection, query) {
    //finds all instances that match the query
    let response = collection.find(query, function (err, results) {
        if (err) return handleError(err);
        return results;
    });
    console.log("all results found");
    return response;
}

function update(collection, query) {
    //update instance with query.id
    collection.updateOne(query.id, query);
    query.id.save(function (err) {
        if (err) console.log(err);
    });
    console.log("instance updated");
    return {updated: true};
}

function remove(collection, query) {
    collection.deleteOne(query);
    //query.id.remove(function (err) {
    //    if (err) console.log(err);
    //});
    console.log("instance deleted");
    return {deleted: true};
}

function createInstance(collection, data) {
    let instance = new collection(data);
    instance.save(function (err) {
        if (err) console.log(err);
    });
    console.log("instance added");
    return {added: "true"};
}

/* https://www.npmjs.com/package/express-ws */

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

        var collection = null;
        try {
            collection = collectionMap[msg.collection];
        } catch(error) {
            console.log(error);
        }
        
        var result = {};

        //add success flag
        result.success = "false";

        //command string - invokes a function based on command and collection
        if (msg.type=="getOne") {
            result = getOne(collection, msg.data);
        } else if (msg.type=="getAll") {
            result = getAll(collection, msg.data);
        } else if (msg.type=="post") {
            result = createInstance(collection, msg.data);
        } else if (msg.type=="delete") {
            result = remove(collection, msg.data);
        } else if (msg.type=="update") {
            result = update(msg.data);
        } else {
            throw new Error("Invalid message type");
        }
    
        //change success flag to true
        result.success = "true";
    
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
