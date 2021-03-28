/** 
 * Sources:
 * https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose
 * https://www.npmjs.com/package/express-ws 
*/

/** Connection to database */
const mongoose = require('mongoose');

const Entity = require('./models/Entity');
const Diagram = require('./models/Diagram');
const User = require('./models/User');

require('dotenv/config');

mongoose.connect(
    process.env.DB_CONNECTION,
    { useNewUrlParser: true },
    () => console.log('connected to DB!')
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

/** Connection to Vive */
const MojoClient = require("./MojoClient.js");

var mojoSocketPort = 9003;
var WebSocket = require('ws');

//UPDATE: maps now indexed by IP
var playersMap = new Map();
var mojoClientsMap = new Map();

setInterval(broadcastMotionUpdate, 1000 / 30);

/** Connection to client */
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

let clientSocketPort = 3000;
let clients = [];

//Hardcoding Jane Doe to be the player that gets moved
let player = {
    id: '178376c1f97-f0fa6018', diagramID: '1', posX: 3, posY: 3, angle: 0,
    mojoPort: mojoSocketPort,
    mojoIpAddress: 'localhost'
};
//Add Jane Doe to playersMap
playersMap.set(player.id, player);

app.ws('/', function (ws, req) {
    console.log("Client connected.");
    clients.push(ws);
    const clientIP = ws._socket.remoteAddress;
    let trackerClient = createMojoClient(player.mojoPort, clientIP);
    if(trackerClient.isConnected()) {
        mojoClientsMap.set(clientIP, trackerClient);
    }

    ws.on('message', function(msgStr) {

        //log message from client
        console.log(msgStr);

        //returns an object that matching the string
        const msg = JSON.parse(msgStr);

        //after JSON.parse:
        /*
            type: "getOne",
            collection: "users",
            data: {name: "Jane", password: "password", id: "487434"},
            requestID: 9389328
        */

        //reference collection into map of models
        const collectionMap = {
            'users': User,
            'entities': Entity,
            'diagrams': Diagram,
            'none': null
        };

        const requestTypes = {
            getOne,
            getAll,
            update,
            remove,
            createInstance,
            newPlayer,
            quitPlayer,
            pauseLiveMotion,
            startLiveMotion
        };

        var collection = collectionMap[msg.collection];
        if(!collection) {
            throw new Error("Invalid message collection: " + msg.collection);
        }

        if (requestTypes[msg.type]) {
            //command string - invokes a function based on command and collection
            requestTypes[msg.type](collection, msg.data, ws, msg.requestID);
        } else {
            throw new Error("Invalid message type");
        }

    });
    console.log('socket', req.testing);
    ws.on('close', (ws) => {
        clients.splice(clients.indexOf(ws), 1);
        console.log("Client disconnected.");
        console.log(ws);
    });
});

//Start Listening to Server:
app.listen(clientSocketPort);

function getOne(collection, query, ws, requestID) {
    //finds a single instance that matches the query
    //query format: {name: Jane}, or {name: Jane, password: password}, or {id: JanesID}, or {name: Jane, id: JanesID}
    collection.findOne(query, function (err, result) {
        if (err) return handleError(err);
        if(err) console.log(err);
        //callback function accesses ws via closure
        respondToSocket({result}, ws, requestID);
    });
}

function getAll(collection, query, ws, requestID) {
    //finds all instances that match the query
    collection.find(query, function (err, result) {
        if(err) console.log(err);
        if (err) return handleError(err);
        respondToSocket({result}, ws, requestID);
    });
}

function update(collection, query, ws, requestID) {
    //update instance with query.id - CANNOT UPDATE THE ID OF AN INSTANCE
    const id = query.id;
    const isEntity = collection === Entity;
    collection.findOneAndUpdate({id}, query, function (err) {
        if (err) console.log(err);
        respondToSocket({updated: true}, ws, requestID);
        if (isEntity) {
            broadcastToClients({
                type: "updateOneEntity",
                data: query
            }, ws);
        } 
    });
}

function remove(collection, query, ws, requestID) {
    //delete first instance that matches query
    collection.findOneAndDelete({id: query.id}, function (err) {
        if (err) console.log(err);
        respondToSocket({deleted: true}, ws, requestID);
        broadcastToClients(query, ws);
    });
}

function createInstance(collection, data, ws, requestID) {
    //create new instance of collection with given data
    let instance = new collection(data);
    instance.save(function (err) {
        if (err) console.log(err);
        respondToSocket({added: true}, ws, requestID);
        broadcastToClients(data, ws);
    });
}

function newPlayer(collection, data, ws, requestID) {
    console.log("New player controlling entity " + data.id);
    if (data.id != undefined) {
        //Because current tracker version probably doesn't set this property, hardcode default
        const diagramID = data.diagramID || "1";
        const mojoIpAddress = ws._socket.remoteAddress;

        const entityInitial = {
            "posX": data.posX,
            "posY": data.posY,
        };

        // Construct a player object, can omit color attribute.
        let player = {
            id: data.id,
            diagramID,
            "angle": 0,
            mojoPort: mojoSocketPort,
            mojoIpAddress,
            entityInitial
        };
        Object.assign(player, entityInitial);
        playersMap.set(mojoIpAddress, player);

        // Reply message to confirm success.
        let messg = {
            cmd: "new player",
            id: data.id,
        };
        
        respondToSocket(messg, ws, requestID);
        broadcastToClients({
            id: data.id,
            diagramID,
            "hasController": true
        }, ws);

        /*
        // New player request will specify the port number and remote WebSocket URI
        // of each player's motion-tracker server.
        // This central server will use a MojoClient to manage each remote motion data stream.
        let mojoClient = createMojoClient(data.mojoPort, data.mojoIpAddress);
        mojoClientsMap.set(data.id, mojoClient);
        */
    }
}

function quitPlayer(collection, data, ws, requestID) {
    console.log("quit player: " + data.id);
    const socketIP = ws._socket.remoteAddress;
    if (data.id != undefined) {
        if (playersMap.get(socketIP).id === data.id) {
            playersMap.delete(socketIP);
        }
    }
    let messg = { type: "quit player", id: data.id };
    respondToSocket(messg, ws, requestID);
    broadcastToClients({
        id: data.id,
        diagramID: data.diagramID,
        "hasController": false
    }, ws);
}

function pauseLiveMotion(collection, data, ws, requestID) {
    // The director's WebClient says everyone pauses live motion streaming
    pauseMojoServers();
}

function startLiveMotion(collection, data, ws, requestID) {
    // The director's WebClient says everyone starts live motion streaming for acting
    startMojoServers();
}

function respondToSocket(msg, ws, requestID) {
    if(requestID) {
        msg.requestID = requestID;
    }
    console.log("Responded to request " + requestID);
    const finalResponse = JSON.stringify(msg);
    ws.send(finalResponse);
}

function broadcastToClients(msgObj, socketToIgnore) {
    const msg = JSON.stringify(msgObj);
    for (const client of clients) {
        if (client !== socketToIgnore) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            } else {
                clients.splice(clients.indexOf(client), 1);
                console.log("Pruned closed connection!");
            }
        }
    }
}

function broadcastMotionUpdate() {
    let playerList = Array.from(playersMap.values());
    if(playerList.length > 0) { 
        let data = [];
        for(const {id, diagramID, posX, posY, angle} of playerList) {
            data.push({id, diagramID, posX, posY, angle});
        }
        const msg = {"type": "updateEntities", data};
        broadcastToClients(msg);
    }
}

/*
function broadcastMap() {
    let playerList = Array.from(playersMap.values());
    // Changed cmd to type
    let messg = { type: "state", players: playerList };
    let jsonMessg = JSON.stringify(messg);

    let numClients = socketServer.clients.length;
	for(let i = 0; i < numClients; i++) {
		let client = socketServer.clients[i];
	    if (client.readyState == WebSocket.OPEN)
			client.send(jsonMessg);
    }
}
*/

/* Create a MojoClient to manage and receive incoming motion tracker server data
 * for one remote client.
 * @param {integer} portNumber - port number of WebSocket used by a motion tracker server.
 * @param {string} ipAddress - WebSocket IP address, example "192.168.10.1" or for
 *        server on localhost use "localhost" or "" empty string.
 */
function createMojoClient(portNumber, ipAddress) {		
    let mojoClient = new MojoClient();
    mojoClient.setDataHandler(onMojoData);

    // MojoClient connect method will construct the WebSocket URI
	// string of the form: "ws://192.168.10.1:3030", where ipAddress "192.168.10.1"
    // and portNumber is 3030.
	mojoClient.connect(portNumber, ipAddress);

	return mojoClient;
}

const MOTION_SCALE_FACTOR = 5;

function onMojoData(data) {
    // Sample incoming JSON message from a remote user's Vive tracker server.
    // { "time": 32.1,
    //   "channels":[{"id": "384327" ,"pos": {"x":0.1, "y":0,"z":2.3},
    //             "rot":{"x":0, "y": 45, "z":0}}]}
    let timeStamp = data.time;
    
    // We expect each remote site to send data for only one moving performer.
    for (let rigidBody of data.channels) {
        const socketIP = this.webSocket._socket.remoteAddress;
		let player = playersMap.get(socketIP);
        if (player !== undefined) {
            const posX = rigidBody.pos.x * MOTION_SCALE_FACTOR;
            const posY = rigidBody.pos.z * MOTION_SCALE_FACTOR;
            const angle = rigidBody.rot.y;
            const bounds = mojoClient.serverState.bounds;
            if(player.trackerInitial === undefined) {
                //Set initial position of tracker
                player.trackerInitial = {posX, posY, angle};
            } else {
                //Update player position
                //Each MojoClient motion sensor defines the range of its positional data.'
                const offsetX = posX - player.trackerInitial.posX;
                const offsetY = posY - player.trackerInitial.posY;
                player.posX = player.entityInitial.posX - offsetX;
                player.posY = player.entityInitial.posY - offsetY;
                player.angle = angle; // rotation angle in degrees.
            }

            /*
            broadcastToClients({
                type: "updateOneEntity",
                data: {
                    id: player.id,
                    diagramID: player.diagramID,
                    posX: player.x,
                    posY: player.y,
                    angle: player.angle
                }
            });
            */
        } else { // end if player is defined.
            console.log("player is undefined");
        }
	}
}

function startMojoServers() {
	let mojoClientsList = Array.from( mojoClientsMap.values() );	
	for(let i = 0; i < mojoClientsList.length; i++)
		mojoClientsList[i].sendMessageBroadcast(true);
}

function pauseMojoServers() {
	let mojoClientsList = Array.from( mojoClientsMap.values() );	
	for(let i = 0; i < mojoClientsList.length; i++)
		mojoClientsList[i].sendMessageBroadcast(false);
}