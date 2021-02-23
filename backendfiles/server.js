//Professor Bares' code for connecting to vive
// Dependencies.
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(5000, function() {
  console.log('Starting server on port 5000');
});

//----------- Application Data ----------------

// Hash Table from key of socket.id to client session object.
// Client session keeps track of userId, role of this user, user preferences, etc.
var clientHashMap = new Map();

// Hash Table from key of Vive tracker socket.id to Tracker session object.
// This map lets the system know which client in clientHashMap is associated
// with an incoming stream of tracker motion data.
var trackerToClientIdMap = new Map();

//---- For now we can assume our server is running only one
//---- rehearsal session.  We are assuming all connected clients
//---- are part of the same play rehearsal.

// If we want everyone on the same moment in the play, then we need to
// maintain data for the rehearsal session.
// This may also be where we keep track of who is currently acting as director.
var rehearsalSession = { id: 1, playId: "Annie", sceneId: 1, actId: 1, 
                         beatId: 1, takeId: 1, directorUserId: "Jane" };

// Hash Table from name of character/prop in play to its blocking data.
// hash table maps from key of characterId --> value of Character blocking data
var characterIdToBlockingMap = new Map();

// Hash Table from key of userId to characterId
// Keep track of which user/client is playing the role of which character.
// A character can only be controlled by one user/client.
// This hash table would be populated based on a database query that
// runs when we change to a different moment in the play.
// The director's client-side GUI could also have a screen that
// lets the director assign character roles to clients who are 
// available that day.
// hash table maps from key of userId --> value of characterId
var clientIdToCharacterIdMap = new Map();

// HACK - cycle through colors for each marker.
// database would store color preference for display of each character.
var markerColorList = [ "#000000", "#ff0000", "#00ff00", "#0000ff", 
                        "#ffff00", "#ff00ff", "#00ffff" ];
var markerCount = 0;

//---------------- Socket.IO Callback function definitions ------------
//---------------------------------------------------------------------
//---- For each type of socket message tag, define a callback function
//---- that will run upon receipt of a message having the given tag name.
//---- This demo did not use the promise ==> notation.
//---- If you wish, you should be able to edit the code to use ==> promises.

//---- It may also be possible to define each callback function separately
//---- in an external .js source file.
// Example.   function onConnect(socket) { body of code }
// io.on("connection", onConnect);
//
// You may find this format more readable as function bodies get longer.
// Note - JavaScript has a very dynamic way to manage scope and lifetime
// of variables.  The socket argument you see below persists through all
// subsequent code inside the {}s that follow io.on("connection", function(socket) 
// If we pull these function bodies out, I think it will still work, but if
// it doesn't this would be the first thing I would review.


/*
 * pre-condition: Socket.IO has been initialized and a new client has connected.
 */
io.on("connection", function(socket) {
	
	console.log("A client has connected.");
	
	/*
	 * on "login"
	 * pre-condition: received message with "login" tag.
	 * dataJSON holds user login credentials of id and password.
	 * post-condition: Creates a new Client Session, Creates a new Character,
	 *      Creates a new CharacterBlocking.
	 */
  socket.on("login", function(dataJSON) {
		
		console.log("client login...");
		
		// Convert JSON text packet into anonymous JavaScript object.
		let data = undefined;
		try {
		  data = JSON.parse(dataJSON);
		  console.log("login by: " + data.userId);
		}
		catch(err) {
			console.log("Error: login message was invalid JSON: " + dataJSON);
		}
		
		if(data != undefined) {
		// Assume each client userId is a character in the play.	
    // Initialize a blocking diagram marker for the character.
    // The real app might use a database table to assign
    // specific clientId to a play a particular character in the play.
		
		// Future - database would maintain table of userId -> character 
		// to keep track of casting of users to characters in the play.
		// For now, just assume characterId == userId.
		let characterId = data.userId;
		
		// Map client to a character in the play
		clientIdToCharacterIdMap.set(data.userId, characterId);
		
		// Create character object in the live blocking diagram.

    // Initialize positions at random.		
		let randX = Math.floor(Math.random() * 800);
		let randY = Math.floor(Math.random() * 600);
		// Assign different marker colors
		let markerColor = markerColorList[ markerCount ];
		markerCount = (markerCount + 1) % markerColorList.length;
		let mapMarker = { id: characterId, x: randX, y: randY, color: markerColor };
		
		// Future work: create a data storage channel for XY and rotation
		// for each entity in the blocking diagram.
		// positionDataChannel IS-A VectorChannel that holds list of { time,x,y }
		let positionDataChannel = undefined;
		// rotationDataChannel IS-A ScalarChannel that holds list of { time,angle }
		let rotationDataChannel = undefined;
		
		// Represents a character's blocking in this moment/take.
		// characterId - ID of character in the play
		// marker - symbol/shape to display in the Canvas diagram
		// isLive - Boolean flag whether to use tracker data to update this marker.
		// isRecord - Boolean flag whether to record marker movement into
		// its position and rotation data channels.
		let characterBlocking = { id: characterId, marker: mapMarker, 
		                          isLive: true, isRecord: false,
		                          channelPosition: positionDataChannel, 
															channelRotation: rotationDataChannel };
	
	  // Insert entry for characterId --> CharacterBlocking data.
		characterIdToBlockingMap.set(characterId, characterBlocking);
		
		// Create a client session data object.
		// Session data per client tracks their userId and preferences, etc.
		let clientSession = { userId: data.userId, preferences: {} };
		
		// Insert hash table entry key is socket.id, value is an object
		// that represents this client's state in the application.
    clientHashMap.set(socket.id, clientSession);
		}// end if data is not undefined.
  });
	
	/*
	 * on "client-request"
	 * pre-condition: received message with tag "client-request"
	 *     Most such requests will involve data base access and
	 *     sending a response to the client.
	 */
  socket.on("client-request", function(dataJSON) {
		
		// Convert JSON text packet into anonymous JavaScript object.
		let data = undefined;
		
		// Try to convert JSON message to anonymous JavaScript object.
		try {
			data = JSON.parse(dataJSON);
		}
		catch(err) {
			console.log("Error: client sent invalid JSON text." + dataJSON);
		}
		
		// retrieve client state object from hash table using key of socket.id.
    let clientSession = clientHashMap.get(socket.id);
		if(data != undefined && clientSession != undefined) {
			let responseObject = undefined;
			
			/*
			
			// Baseline - test case for client-server integration testing
      // baseline hello world test case - just request and send back a
			// hard-coded blocking map to our blocking display client GUI
			// Mongo DB can simply store a JSON text version of the hard-coded
			// diagram currently found in the blocking demo.
			if(data.command == "get-blocking") {
				responseObject = database.get(data.playId, data.actId, data.beatId);
				
			//---- FUTURE WORK ---------------
			if(data.command == "pass-director-token")
				 temporarily re-assign director role as stored in rehearsalSession.
			   we can decide policy for which of the following commands
				 can only be issued by the director.  we could also have a 
				 client GUI option that allows the director to choose one
				 of several policy options that vary in which commands any
				 performer can issue.
			
			if(data.command == "set-current-moment")
				 set rehearsalSession's current play, act, scene, beat, take IDs
			
			if(data.command == "mask-live-characters")
				 update flags that indicate which characters should be live
			   and have their movements updated in the live blocking diagram
			
			if(data.command == "mask-record-characters")
				 update flags that indicate which characters should have
			   their movements recorded into its associated data channels
						
			if(data.command == "start-live-blocking")
				 create timer interval that drives callbacks to broadcast current live blocking to all clients
         See below code for broadcastBlockingDiagramInterval 
			 
			if(data.command == "stop-live-blocking")
				 clear timer interval that drives callbacks to broadcast of live blocking to all clients
		     See below code for broadcastBlockingDiagramInterval 
		
			if(data.command == "start-record-blocking")
				 assumes we are live streaming blocking
			   we should post recorded channel into Mongo DB every N seconds
				 so as to keep the size of motion data blocks from getting to big.

			if(data.command == "stop-record-blocking")
				 closes motion channel recorder
			   writes most recent block of motion data to Mongo DB
				
			*/
			
			// For now, just echo back the client's message.
			console.log("send reply to client " + clientSession.userId);
			
			responseObject = data;
			socket.emit("server-reply-to-client-request", JSON.stringify(responseObject));
		}
  });
	
	/*
	  Rough sketch of possible way to receive vive tracking data.
		TO-DO: How does the Python Vive tracker data streamer open a socket
		connection to this Node.js server?
		Can it connect using the same port number? 
		At a minimum we need to distinguish between Web client connections
		and Vive tracker connections.  We don't want to broadcast the blocking
		diagram to Vive tracker connections.
		
    socket.on("vive-connect", function(dataJSON) {	
		  data will include an ID that indicates userId of the performer.  
			let data = JSON.parse(dataJSON);
			
			// Map Vive tracker socket.id to trackerSession object.
			let trackerSession = { userId: data.userId };
			trackerToClientIdMap.set(socket.id, trackerSession);
	  }
		
		socket.on("vive-data", function(dataJSON) {	
		  let data = JSON.parse(dataJSON);
			let trackerSession = trackerToClientIdMap.get(socket.id);
			if(trackerSession != undefined) {
				// Get ID of character being controlled by this client userId.
			  let characterId = clientIdToCharacterIdMap.get(trackerSession.userId);
				// Get blocking marker of this characterId.
				let characterBlocking = characterIdToBlockingMap.get(characterId);
				
				// Check if live update flag is ON for this character
				if(characterBlocking.isLive) {			
				  // Get blocking diagram marker associated with this character.
				 
				  // Update position and rotation of this marker using Vive data.
					
					if(characterBlocking.isRecord) {
						// Append updated marker position XY into characterBlocking.channelPosition
						
						// Append updated marker rotation angle into characterBlocking.channelRotation
					}
						
					
				}// end if live updates of this character's marker.
			
			}// end if trackerSession != undefined
	  }
	*/
	
}); // end of io.on

// Start generating callbacks to onBroadcastBlockingDiagram at a rate of
// 5 times per second.  Express interval in milliseconds.
var broadcastBlockingDiagramInterval = setInterval(onBroadcastBlockingDiagram, 1000 / 5);

// Can later pause/stop broadcasting live map by saying...
// clearInterval(broadcastBlockingDiagramInterval);

/*
 * onBroadcastBlockingDiagram
 * pre-condition: timer interval callback has been triggered.
 * post-condition: broadcast current blocking diagram markers to all Web clients.
 */
function onBroadcastBlockingDiagram() {
  // List of diagram marker symbols to draw in client-side Canvases.
	let markerList = [];
	// Iterate over all values in the characterIdToBlockingMap hash map.
	// Each value is a CharacterBlocking object that HAS-A marker.
	for (let characterBlocking of characterIdToBlockingMap.values()) {
		
		// HACK just so we see movement in the diagram.
		characterBlocking.marker.x += 1;
		if(characterBlocking.marker.x > 790)
			characterBlocking.marker.x = 10;
		
    markerList.push(characterBlocking.marker);
	}
	// Broadcast current copy of blocking diagram markers to all clients.
  io.sockets.emit("blocking-diagram", markerList);
}