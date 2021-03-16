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

/** Connection to client */
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

var clientSocketPort = 3000;
var clients = [];

app.use(function (req, res, next) {
    console.log('middleware');
    req.testing = 'testing';
    return next();
});

app.ws('/', function(ws, req) {
    clients.push(ws);
    ws.on('message', function(msgStr) {
        console.log("Client connected.");

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
    ws.on('close', () => {
        console.log("Client disconnected.");
    });
});

//Start Listening to Server:
app.listen(clientSocketPort);

/* https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose */

function getOne(collection, query, ws, requestID) {
    //finds a single instance that matches the query
    //query format: {name: Jane}, or {name: Jane, password: password}, or {id: JanesID}, or {name: Jane, id: JanesID}
    collection.findOne(query, function (err, result) {
        if (err) return handleError(err);
        console.log(err, result);
        //callback function accesses ws via closure
        respondToSocket({result}, ws, requestID);
    });
}

function getAll(collection, query, ws, requestID) {
    //finds all instances that match the query
    collection.find(query, function (err, result) {
        console.log(err, result);
        if (err) return handleError(err);
        respondToSocket({result}, ws, requestID);
    });
}

function update(collection, query, ws, requestID) {
    //update instance with query.id - CANNOT UPDATE THE ID OF AN INSTANCE
    collection.findOneAndUpdate(query.id, query, function (err) {
        if (err) console.log(err);
        respondToSocket({updated: true}, ws, requestID);
    });
}

function remove(collection, query, ws, requestID) {
    //delete first instance that matches query
    collection.findOneAndDelete(query, function (err) {
        if (err) console.log(err);
        respondToSocket({deleted: true}, ws, requestID);
    });
}

function createInstance(collection, data, ws, requestID) {
    //create new instance of collection with given data
    let instance = new collection(data);
    instance.save(function (err) {
        if (err) console.log(err);
        respondToSocket({added: true}, ws, requestID);
    });
}

/* https://www.npmjs.com/package/express-ws */

//TODO: get a better callback structure going than this
function respondToSocket(msg, ws, requestID) {
    if(requestID) {
        msg.requestID = requestID;
    }
    console.log(msg);
    const finalResponse = JSON.stringify(msg);
    ws.send(finalResponse);
}

function broadcastToClients(msg, clients) {

}

/** Connection to Vive */
const MojoClient = require("./MojoClient.js");

var mojoSocketPort = 4030;
var WebSocket = require('ws');
var socketServer = new WebSocket.Server({port:mojoSocketPort});
var playersMap = new Map();
var playersMapUpdateInterval = undefined;
var mojoClientsMap = new Map();


socketServer.on('connection', function(socket) {
    console.log("Client connected on vive socket");
    socket.on('message', function(incomingMessgJason) {
        let incomingMessg = JSON.parse(incomingMessgJson);
        console.log(JSON.stringify(incomingMessg));
        if (incomingMessg.cmd == "new player") {
            console.log("create new player: " + incmomingMessg.id +
            " with Mojo server on port#" + incomingMessg.mojoPort +
            " at IP address: " + incomingMessg.mojoIpAddress);
            if(incomingMessg.id != undefined) {
                // Construct a player object, can omit color attribute.
                let player = { id: incomingMessg.id, x: 300, y: 300, angle: 0,
                        mojoPort: incomingMessg.mojoPort,
                        mojoIpAddress: incomingMessg.mojoIpAddress };
                playersMap.set(incomingMessg.id, player );

                // Reply message to confirm success.
		        let messg = { cmd: "new player", id: incomingMessg.id,
                mojoPort: incomingMessg.mojoPort, mojoIpAddress: incomingMessg.mojoIpAddress };
                socket.send(JSON.stringify(messg));

                // New player request will specify the port number and remote WebSocket URI
                // of each player's motion-tracker server.
                // This central server will use a MojoClient to manage each remote motion data stream.
                let mojoClient = createMojoClient(incomingMessg.mojoPort, incomingMessg.mojoIpAddress);
                mojoClientsMap.set(incomingMessg.id, mojoClient);
            }
        } else if (incomingMessg.cmd == "pause live motion") {
			// The director's WebClient says everyone pauses live motion streaming
			pauseMojoServers();
		} else if (incomingMessg.cmd == "start live motion") {
			// The director's WebClient says everyone starts live motion streaming for acting
			startMojoServers();
		} else if (incomingMessg.cmd == "quit player") {
			console.log("quit player: " + incomingMessg.id);
			if (incomingMessg.id != undefined) {
				playersMap.delete(incomingMessg.id);
			}
		  let messg = { cmd: "quit player", id: incomingMessg.id };
		  socket.send(JSON.stringify(messg));
		}
    });
});

playersMapUpdateInterval = setInterval(broadcastMap, 1000 / 30);

function broadcastMap() {
	let playerList = Array.from( playersMap.values() );
    let messg = { cmd: "state", players: playerList };
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
    //   "channels":[{"id": "Jane" ,"pos": {"x":0.1, "y":0,"z":2.3},
    //             "rot":{"x":0, "y": 45, "z":0}}]}
    let timeStamp = data.time;
    // We expect each remote site to send data for only one moving performer.
    for (let c = 0; c < data.channels.length; c++) {
		let rigidBody = data.channels[c];
		
		// Get moving player object by unique ID provided by incoming motion-tracker server data stream.
		let player = playersMap.get(rigidBody.id);
		if (player != undefined) {	
			// Each MojoClient motion sensor defines the range of its positional data.
			let bounds = mojoClient.serverState.bounds;
		
			// Convert rigid body position from sensor device coordinates to 
			// current play stage dimensions.
			
			// For this unit test demo, we assume stage is canvas of size 800 x 600
			let x = ((rigidBody.pos.x - bounds.minX)/(bounds.maxX - bounds.minX)) * 800;
			let y = ((rigidBody.pos.z - bounds.minZ)/(bounds.maxZ - bounds.minZ)) * 600;			
			player.x = x;
			player.y = y;
			player.angle = body.rot.y; // rotation angle in degrees.
		} // end if player is defined.
	}
}

function startMojoServers()
{
	let mojoClientsList = Array.from( mojoClientsMap.values() );	
	for(let i = 0; i < mojoClientsList.length; i++)
		mojoClientsList[i].sendMessageBroadcast(true);
}

function pauseMojoServers()
{
	let mojoClientsList = Array.from( mojoClientsMap.values() );	
	for(let i = 0; i < mojoClientsList.length; i++)
		mojoClientsList[i].sendMessageBroadcast(false);
}
