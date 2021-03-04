const express = require('express');
const expressWs = require('express-ws');
const { populate } = require('../models/Character');
const Character = require('../models/Character');
const Diagram = require('../models/Diagram');
const Play = require('../models/Play');
const User = require('../models/User');
const router = express.Router();

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

function createInstance(collection) {
    var instance = new collection(msg.data);
    console.log("instance added");
    return instance;
}

router.ws('/', (ws, req) => {
    console.log("Client connected.");

    /*assume msg is in this format:
    {
        type: what to do, i.e. getOne, getAll, post, delete, update
        collection: which collection, i.e. users, plays, diagrams, characters
        data: the data, i.e. {name: Jane, password: password, id: <JanesID>} //could have name, password, id, or some combination
    }
    */

    ws.on('message', (msgStr) => {
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
        
        const result = null;

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

        //add success flag
        result.success = "TRUE";

        //convert result back into string
        var finalResult = JSON.stringify(result);

        //send result back
        ws.send(finalResult);
    });

    ws.on('close', () => {
        console.log("Client disconnected.");
    });
});

module.exports = router;