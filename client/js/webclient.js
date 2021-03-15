//Exchanges data with the server

/* -----THE PROTOCOL-----
DATA IN should arrive as stringified JSON with the following format:
{
	type: "foo",
	id: "123456789-abcdef",
	data: {}
}
where:
	TYPE is a string identifying the kind of data contained
	ID is the unique ID of the request, for tracking callbacks
	DATA is a JSON object containing the data
WebClient determines based on "type" what behavior to enact and on what module
of the app it should be enacted.
*/

import {uniqueID} from "./util.js";

let socket, isOpen = false;
let diagrams = {};
let pendingCallbacks = {};

//HANDLERS FOR DATA OF DIFFERENT TYPES. This is the important bit.
//New behaviors for how to handle incoming data are added here. This keeps
//these handlers in one place, rather than spread throughout the project files.
const requestTypes = {
	/*
	Get the complete list of entities on the diagram.
	DATA: an array of entity data objects.
	*/
	"entities_set": function(data, app) {
		app.diagram.entities = [];
		app.diagram.addUnclassifiedEntity(...data);
		app.diagram.draw();
	},
	/*
	Update one or more properties of one entity
	DATA: entity id and the attributes to be updated, in a flat object.
	*/
	"entity_update": function(data, app) {
		const entity = app.diagram.getEntityById(data.id);
		delete data.id;
		//With id out of the way, we drop other properties into the entity
		for(const p in data) { //Notice: "in," not "of." They're different.
			if (entity.__lookupSetter__(p)) {
				entity[p] = data[p];
			} else {
				entity.data[p] = data[p];
			}
		}
		app.diagram.draw();
	}
}

//TODO: this will want more detail if we enable users to "log into" diagrams
export function registerDiagram(dg) {
	diagrams[dg.id] = dg;
}

///////////////////////////////////////////////////////////
//HANDLING MESSAGES

function onWSMessage(e) {
	const msg = JSON.parse(e.data);

	if(msg.hasOwnProperty("id") && pendingCallbacks.hasOwnProperty(msg.id)) {
		//Message is a response to a request - look for callback
		pendingCallbacks[msg.id](msg);
		delete pendingCallbacks[msg.id];
	} else if(msg.hasOwnProperty("type")) {
		//Message is a request from the server - look for handler
		if(!requestHandler.hasOwnProperty(msg.type)) {
			console.error("Socket: recieved message with invalid type: ", msg.type);
		}
		const requestHandler = requestTypes[msg.type];
	} else {
		console.error("Socket: unsure what to do with incoming message");
		console.log("Message contents:", msg);
	}
}

export function open(url, openCallback, errorCallback) {
	if(!isOpen) {
		socket = new WebSocket(url);
		socket.onopen = function() {
			console.log("Socket: open!");
			if(openCallback) openCallback();
		}
		socket.onerror = function() {
			console.error("Socket: error!");
			if(errorCallback) errorCallback();
		}
		socket.onclose = function() {

		}
		socket.onmessage = onWSMessage;
		isOpen = true;
	}
}

export function close() {
	if(isOpen) {
		socket.close();
		isOpen = false;
	}
}

export function send(msg, callback) {
	if(!isOpen) {
		console.error("Socket: attempt to send message while socket closed!");
		return;
	}
	const id = uniqueID();
	msg.id = id;
	if(callback) {
		pendingCallbacks[id] = callback;
	}
	socket.send(JSON.stringify(msg));
	//console.log("Sent message: ", msg);
}

///////////////////////////////////////////////////////////
//FUNCTIONS MANAGING UPDATE QUEUE, FOR RATE LIMITING

//Minimum time (in ms) between update broadcasts
const UPDATE_BLOCK_TIME = 250;
let blockUpdates = false;
let pendingUpdates = {};
/* pendingUpdates is a two-layer object storing collections
	and id-indexed maps to objects.
Like so:
pendingUpdates = {
	entity: {
		"178376c5ebe-ed6977df": {<entity data object>},
		"178376c1f97-f0fa6018": {<entity data object>}
	},
	diagram: {
		"178376bd722-3ce707b5": {<diagram data object>}
	}
}
*/

function unblockUpdatesAndSend() {
	if (Object.keys(pendingUpdates).length > 0) {
		for (const [c, o] of Object.entries(pendingUpdates)) {
			sendUpdates(c, Object.values(o));
			delete pendingUpdates[c];
		}
		window.setTimeout(unblockUpdatesAndSend, UPDATE_BLOCK_TIME);
	} else {
		blockUpdates = false;
	}
}

function sendUpdates(collection, objArray) {
	for (const data of objArray) {
		const msg = { type: "update", collection, data };
		send(msg);
	}
}

//Applies rate limits to update requests, so we don't spam the server
export function queueUpdate(collection, ...objects) {
	if(blockUpdates) {
		if(!pendingUpdates.hasOwnProperty(collection)) {
			pendingUpdates[collection] = {};
		}
		let collectionQueue = pendingUpdates[collection];
		for(const o of objects) {
			collectionQueue[o.id] = o;
		}
	} else {
		sendUpdates(collection, objects);
		blockUpdates = true;
		window.setTimeout(unblockUpdatesAndSend, UPDATE_BLOCK_TIME);
	}
}