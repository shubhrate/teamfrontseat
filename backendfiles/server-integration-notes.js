// References: 
// https://levelup.gitconnected.com/getting-started-with-node-js-and-websockets-f22dd0452105
// https://masteringjs.io/tutorials/node/websockets

// Server will have a MojoClient to receive incoming motion-tracker data
// from each remote client user.

// Dependencies.
var express = require('express');
var http = require('http');
var path = require('path');
var WebSocket = require('ws');

// How to import your own external JavaScript code modules.
// https://www.w3schools.com/nodejs/nodejs_modules.asp
// https://stackoverflow.com/questions/5697061/how-to-manage-multiple-js-files-server-side-with-node-js
// https://www.freecodecamp.org/news/require-module-in-node-js-everything-about-module-require-ccccd3ad383/


// INTEGERATE
// MojoClient provides code to manage central server's connection to each 
// remote Python Vive service.  The central server is-a client connecting
// to one remote Vive server per remote performer.
//
// Mojo Client class
// Use the ./ notation to refer to a source file located in the
// same folder as this server.js file.
const MojoClient = require("./MojoClient.js");


// Import module installed by npm, or explicitly put into the ./node_modules/
// require("MojoClient.js");

// Creating an npm module
// https://www.codementor.io/@edaxfilanderucleshernandez/building-a-utility-class-as-a-module-npm-cnsge9a5g



var httpPort = 5010;

var app = express();
var httpServer = http.Server(app);


// INTEGERATE
// Server uses this different port# to communicate with FrontSeat Web clients
// regarding motion-data services.
var mojoSocketPort = 4030;

// INTEGERATE - name a different second socket server that will 
// communicate with FrontSeat Web clients regarding motion-data services.
var socketServer = new WebSocket.Server({port:mojoSocketPort});


app.set('port', httpPort);
app.use('/static', express.static(__dirname + '/static'));

// Routing to serve client the .html app home page.
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

httpServer.listen(httpPort, function() {
  console.log("Starting HTTP server on port " + httpPort);
});



// INTEGERATE
// Hash Map of active copy of position and rotation of each moving character.
// These don't need to be full copies of the Entity object. 
// A player HAS-A id, x, y, and angle attributes along with the
// IP address and port # of each remote player's Vive server.
var playersMap = new Map();

// Already in Diagram entity, FrontSeat client and database manage
// unique color style of each diagram entity.
// Used to assign a unique color to each player as they join.
var playerColors = [ "blue", "red", "green", "purple", "brown", "black" ];


// INTEGERATE
// timer interval used to callback function that broadcasts motion updates to all clients.
var playersMapUpdateInterval = undefined;

// INTEGERATE
// Hash Map where key is userId and value is-a MojoClient that manages a WebSocket
// connection to a motion-device server.
var mojoClientsMap = new Map();


// INTEGERATE
// new code that listens to vive motion socket
// Be sure that socketServer variable has a unique name from any existing
// socketServer that handles database updates.
socketServer.on('connection', function(socket) {
	
	console.log("Client connected on socket");
	
	socket.on('message', function(incomingMessgJson) {
		
		let incomingMessg = JSON.parse(incomingMessgJson);
		console.log(JSON.stringify(incomingMessg));
		
		// NOT NEEDED NOW - FrontSeat Client is already posting diagram updates
		// when user edits the diagram via mouse input.
		// My unit test client had keyboard input mode
		// Clients can also use WASD arrow keys to move their player.
	  if(incomingMessg.cmd == 'movement') {
			// Use ID to retreive player object from hash map.
			let player = playersMap.get(incomingMessg.id);
			if(player != undefined) {
				let dir = incomingMessg.dir;
				if (dir.left)
					player.x -= 5;
				else if (dir.right)
					player.x += 5;
				if (dir.up)
					player.y -= 5;
				else if (dir.down)
					player.y += 5;
			}
		}	

		// INTEGERATE
    // WebClients that control a moving character will send message "new player" to this server using
		// socketServer and mojoSocketPort.
		// Message gives id of character in the play and IP address and port # of each remote performer's
		// Vive motion server.
		else if(incomingMessg.cmd == "new player") {
			console.log("create new player: " + incomingMessg.id + 
					" with Mojo server on port#" + incomingMessg.mojoPort +
					" at IP address: " + incomingMessg.mojoIpAddress);
					
			if(incomingMessg.id != undefined) {
				
				// NOT RELEVANT - Server just needs Player objects to know ID, x, y, angle...
				// DiagramEntity objects in database already know their color.
				// Assign next unique color
				let numPlayers = playersMap.size;
				let pColor = playerColors[ (numPlayers+1)% playerColors.length ]; 
				
				
				// Construct a player object, can omit color attribute.
				let player = { id: incomingMessg.id, color: pColor, x: 300, y: 300, angle: 0,
                       mojoPort: incomingMessg.mojoPort,
                       mojoIpAddress: incomingMessg.mojoIpAddress };
			  playersMap.set(incomingMessg.id, player );
				
				// Reply message to confirm success.
		    let messg = { cmd: "new player", id: incomingMessg.id, color: pColor,
              				mojoPort: incomingMessg.mojoPort, mojoIpAddress: incomingMessg.mojoIpAddress };
		    socket.send(JSON.stringify(messg));
				
				// New player request will specify the port number and remote WebSocket URI
				// of each player's motion-tracker server.
				// This central server will use a MojoClient to manage each remote motion data stream.				
				let mojoClient = createMojoClient(incomingMessg.mojoPort, incomingMessg.mojoIpAddress);
				mojoClientsMap.set(incomingMessg.id, mojoClient);
			}
		}
		// INTEGERATE
		// FrontSeat WebClient UI needs to give either all clients or the designated director
		// a toggle button to start/pause Vive motion streaming.
		// WebClient will send message object { cmd: "pause live motion" } to this server using
		// socketServer on mojoSocketPort as opened above.
		else if(incomingMessg.cmd == "pause live motion") {
			// The director's WebClient says everyone pauses live motion streaming
			pauseMojoServers();
		}
		// INTEGERATE
		// FrontSeat WebClient UI needs to give either all clients or the designated director
		// a toggle button to start/pause Vive motion streaming.
		// WebClient will send message object { cmd: "start live motion" } to this server using
		// socketServer on mojoSocketPort as opened above.
		else if(incomingMessg.cmd == "start live motion") {
			// The director's WebClient says everyone starts live motion streaming for acting
			startMojoServers();
		}
		else if(incomingMessg.cmd == "quit player") {
			console.log("quit player: " + incomingMessg.id);
			if(incomingMessg.id != undefined) {
				playersMap.delete(incomingMessg.id);
			}
		  let messg = { cmd: "quit player", id: incomingMessg.id };
		  socket.send(JSON.stringify(messg));
		}
		
	}); // end on-message.
}); // end on-connection.


// INTEGERATE
// Start timer interval that will callback broadcast vive motion updates 30 times per second.
playersMapUpdateInterval = setInterval(broadcastMap, 1000 / 30);

// INTEGERATE
// Broadcast of copy of the current state of any Vive moving characters to all
// FrontSeat clients.
function broadcastMap() {
	let playerList = Array.from( playersMap.values() );
	
	// INTEGERATE
	// FrontSeat WebClient will need to listen for this message...
	// Each player HAS... { id: "Jane", x: 100, y: 87, angle: 30 }
	// FrontSeat WebClient will update x,y,angle of each moved character
	
	let messg = { cmd: "state", players: playerList };
	// convert outgoing message to JSON text format.
	let jsonMessg = JSON.stringify(messg);
	
	// Get number of connected clients on dedicated vive socket server
  let numClients = socketServer.clients.length;
	for(let i = 0; i < numClients; i++) {
		let client = socketServer.clients[i];
	  if(client.readyState == WebSocket.OPEN)
			client.send(jsonMessg);
	}
}

// INTEGERATE
//------------- MOJO Clients ---------------

/*
* // INTEGERATE
  // Front Seat Web client will need to login and say the IP and port of
	// its local Vive tracker streamer service.

 * Create a MojoClient to manage and receive incoming motion tracker server data
 * for one remote client.
 * @param {integer} portNumber - port number of WebSocket used by a motion tracker server.
 * @param {string} ipAddress - WebSocket IP address, example "192.168.10.1" or for
 *        server on localhost use "localhost" or "" empty string.
 */
function createMojoClient(portNumber, ipAddress) 
{		
  let mojoClient = new MojoClient();
  mojoClient.setDataHandler(onMojoData);
	
	// MojoClient connect method will construct the WebSocket URI
	// string of the form: "ws://192.168.10.1:3030", where ipAddress "192.168.10.1"
  // and portNumber is 3030.	
	mojoClient.connect(portNumber, ipAddress);
	
	return mojoClient;
}	

// INTEGERATE - receive a motion data packet from Dexter's Vive code...
function onMojoData(data)
{
  // Sample incoming JSON message from a remote user's Vive tracker server.
  // { "time": 32.1,
  //   "channels":[{"id": "Jane" ,"pos": {"x":0.1, "y":0,"z":2.3},
  //             "rot":{"x":0, "y": 45, "z":0}}]}
  let timeStamp = data.time;
	// We expect each remote site to send data for only one moving performer.
  for(let c = 0; c < data.channels.length; c++)
  {
		let rigidBody = data.channels[c];
		
		// Get moving player object by unique ID provided by incoming motion-tracker server data stream.
		let player = playersMap.get(rigidBody.id);
		if(player != undefined) {
			
			// Each MojoClient motion sensor defines the range of its positional data.
			let bounds = mojoClient.serverState.bounds;
		
			// Convert rigid body position from sensor device coordinates to 
			// current play stage dimensions.
			
			// INTEGRATE --- Vive XY coordinates reported in meters must be converted to
			// FrontSeat Diagram coordinate units.
			// For those taking CS 300 Graphics, this is the World Coordinates to Viewport mapping.
			// For this unit test demo, we assume stage is canvas of size 800 x 600
			let x = ((rigidBody.pos.x - bounds.minX)/(bounds.maxX - bounds.minX)) * 800;
			let y = ((rigidBody.pos.z - bounds.minZ)/(bounds.maxZ - bounds.minZ)) * 600;			
			player.x = x;
			player.y = y;
			player.angle = body.rot.y; // rotation angle in degrees.
		}// end if player is defined.
	}
}

// INTEGERATE
// Next step: FrontSeatWeb client has a start/stop Vive button that sends message.
// WebClient will connect to socketServer on mojoSocketPort = 4030.
// WebClient will send 
// Central server will be in charge of telling all remote motion-tracker servers when
// they should begin broadcasting their motion data streams.
function startMojoServers()
{
	let mojoClientsList = Array.from( mojoClientsMap.values() );	
	for(let i = 0; i < mojoClientsList.length; i++)
		mojoClientsList[i].sendMessageBroadcast(true);
}

// INTEGERATE
// Central server will be in charge of telling all remote motion-tracker servers when
// they should stop broadcasting their motion data streams.
function pauseMojoServers()
{
	let mojoClientsList = Array.from( mojoClientsMap.values() );	
	for(let i = 0; i < mojoClientsList.length; i++)
		mojoClientsList[i].sendMessageBroadcast(false);
}