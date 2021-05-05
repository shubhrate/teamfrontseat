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
var socketServer = new WebSocket.Server({ port: mojoSocketPort });

var playersMap = new Map();
var playersMapUpdateInterval = undefined;
var mojoClientsMap = new Map();

playersMapUpdateInterval = setInterval(broadcastMap, 1000 / 30);

/** Connection to client */
const express = require('express');
const e = require('express');
const app = express();
const expressWs = require('express-ws')(app);

var clientSocketPort = 3000;
var clients = [];

//Hardcoding Jane Doe and John Doe to be the players that gets moved
let playerOne = {
    id: '178376c1f97-f0fa6018', diagramID: '1', x: 3, y: 3, angle: 0,
    mojoPort: mojoSocketPort,
    // Needs to be the IP address of the computer running the tracking server
    mojoIpAddress: process.env.PLAYER_ONE_IP
};
let playerTwo = {
    id: '178376c5ebe-0ed6977d', diagramID: '1', x: 3, y: 2, angle: 0,
    mojoPort: mojoSocketPort,
    // Needs to be the IP address of the computer running the tracking server
    mojoIpAddress: process.env.PLAYER_TWO_IP
};
//Add Jane Doe and John Doe to playersMap
playersMap.set(playerOne.id, playerOne);
playersMap.set(playerTwo.id, playerTwo);

app.use(function (req, res, next) {
    req.testing = 'testing';
    return next();
});

app.ws('/', function (ws, req) {
    console.log("Connected to client.");
    clients.push(ws);

    // Add Jane Doe and John Doe to mojo clients map
    let viveClientOne = createMojoClient(playerOne.mojoPort, playerOne.mojoIpAddress);
    mojoClientsMap.set(playerOne.id, viveClientOne);
    let viveClientTwo = createMojoClient(playerTwo.mojoPort, playerTwo.mojoIpAddress);
    mojoClientsMap.set(playerTwo.id, viveClientTwo);
    
    ws.on('message', function(msgStr) {
        //returns an object that matching the string
        const msg = JSON.parse(msgStr);
        console.log("Received message from client of type " + msg.type);

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
            connectPlayer,
            pauseLiveMotion,
            startLiveMotion,
            quitPlayer
        };

        var collection = collectionMap[msg.collection];
        if (!(msg.type == "readFile")) {
            if(collection === undefined) {
                throw new Error("Invalid message collection: " + msg.collection);
            }
        } 
        
        if (requestTypes[msg.type]) {
            //command string - invokes a function based on command and collection
            requestTypes[msg.type](collection, msg.data, ws, msg.requestID);
        } else {
            throw new Error("Invalid message type");
        }

    });
    ws.on('close', (ws) => {
        clients.splice(clients.indexOf(ws), 1);
        console.log("Disconnected from client.");
    });
});

//Start Listening to Server:
app.listen(clientSocketPort);

function getOne(collection, query, ws, requestID) {
    //finds a single instance that matches the query
    //query format: {name: Jane}, or {name: Jane, password: password}, or {id: JanesID}, or {name: Jane, id: JanesID}
    collection.findOne(query, function (err, result) {
        if(err) console.log(err);
        if (err) return handleError(err);
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
                type: "entity_update",
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
        if (collection == Entity) {
            broadcastToClients({
                type: "entity_remove",
                data: {
                    id: query.id,
                    diagramID: query.diagramID
                }
            });
        } else {
            broadcastToClients(query, ws);
        }
    });
}

function createInstance(collection, inputData, ws, requestID) {
    //create new instance of collection with given data
    let instance = new collection(inputData);
    instance.save(function (err) {
        if (err) console.log(err);
        respondToSocket({added: true}, ws, requestID);
        if (collection == Entity) {
            broadcastToClients({
                type: "entity_add",
                data: {
                    id: inputData.id,
                    diagramID: inputData.diagramID,
                    class: inputData.class,
                    drawType: inputData.drawType,
                    name: inputData.name,
                    color: inputData.color,
                    color2: inputData.color2,
                    posX: inputData.posX,
                    posY: inputData.posY,
                    size: inputData.size,
                    angle: inputData.angle
                }
            });
        } else {
            broadcastToClients(data, ws);
        }
    });
}

function connectPlayer(collection, data, ws, requestID) {
    console.log("create new player: " + data.id +
                " with Mojo server on port#" + data.mojoPort +
                " at IP address: " + data.mojoIpAddress);
    if (data.id != undefined) {
        //Because current tracker version probably doesn't set this property, hardcode default
        const diagramID = data.diagramID || "1";

        // Construct a player object, can omit color attribute.
        let player = {
            id: data.id, diagramID, x: 3, y: 3, angle: 0,
            mojoPort: data.mojoPort,
            mojoIpAddress: data.mojoIpAddress
        };
        playersMap.set(data.id, player);

        // Reply message to confirm success.
        let messg = {
            cmd: "new player", id: data.id,
            mojoPort: data.mojoPort, mojoIpAddress: data.mojoIpAddress
        };
        
        respondToSocket(messg, ws, requestID);
        broadcastToClients(messg, ws);

        // New player request will specify the port number and remote WebSocket URI
        // of each player's motion-tracker server.
        // This central server will use a MojoClient to manage each remote motion data stream.
        let mojoClient = createMojoClient(data.mojoPort, data.mojoIpAddress);
        mojoClientsMap.set(data.id, mojoClient);
    }
}

function pauseLiveMotion(collection, data, ws, requestID) {
    // The director's WebClient says everyone pauses live motion streaming
    pauseMojoServers();
}

function startLiveMotion(collection, data, ws, requestID) {
    // The director's WebClient says everyone starts live motion streaming for acting
    startMojoServers();
}

function quitPlayer(collection, data, ws, requestID) {
    console.log("quit player: " + data.id);
    if (data.id != undefined) {
        playersMap.delete(data.id);
    }
    let messg = { type: "quit player", id: data.id };
    respondToSocket(messg, ws, requestID);
    broadcastToClients(messg, ws);
}

function respondToSocket(msg, ws, requestID) {
    if(requestID) {
        msg.requestID = requestID;
    }
    if (ws.readyState == WebSocket.OPEN) {
        const finalResponse = JSON.stringify(msg);
        ws.send(finalResponse);
        console.log("sent a response to client");
    } else {
        console.log("Could not respond to request " + requestID + ". The socket is closed.");
    }
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

function onMojoData(data) {
    // Sample incoming JSON message from a remote user's Vive tracker server.
    // { "time": 32.1,
    //   "channels":[{"id": "384327" ,"pos": {"x":0.1, "y":0,"z":2.3},
    //             "rot":{"x":0, "y": 45, "z":0}}]}
    //console.log("Data Revieved!");
    let timeStamp = data.time;
    
    // We expect each remote site to send data for only one moving performer.
    for (let c = 0; c < data.channels.length; c++) {
		let rigidBody = data.channels[c];
		// Get moving player object by unique ID provided by incoming motion-tracker server data stream.
		let player = playersMap.get(rigidBody.id);
        if (player != undefined) {
            // Each MojoClient motion sensor defines the range of its positional data.
            let mojoClient = mojoClientsMap.get(player.id);
            let bounds = mojoClient.serverState.bounds;
            let minX = -2;
            let maxX = 2;
            let minZ = -2;
            let maxZ = 2;

            // Convert rigid body position from sensor device coordinates to 
            // current play stage dimensions.

            // For this unit test demo, we assume stage is canvas of size 800 x 600
            //let x = ((rigidBody.pos.x - bounds.minX)/(bounds.maxX - bounds.minX)) * 3;
            //let y = ((rigidBody.pos.z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * 3;
            //let x = ((rigidBody.pos.x - minX) / (maxX - minX)) * 10;
            //let y = ((rigidBody.pos.z - minZ) / (maxZ - minZ)) * 10;
            let x = rigidBody.pos.x * 5;
            let y = rigidBody.pos.z * 5;
            player.x = x;
            player.y = y;
            player.angle = rigidBody.rot.y; // rotation angle in degrees.

            broadcastToClients({
                type: "entity_update",
                data: {
                    id: player.id,
                    diagramID: player.diagramID,
                    posX: player.x,
                    posY: player.y,
                    angle: player.angle
                }
            });
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