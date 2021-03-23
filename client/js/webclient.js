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
	DATA: entity/diagram id and the attributes to be updated, in a flat object.
	*/
	"entity_update": function(data) {
		const diagram = diagrams[data.diagramID];
		const entity = diagram.getEntityById(data.id);
		delete data.diagramID;
		delete data.id;
		//With ids out of the way, we drop other properties into the entity
		for(const p in data) { //Notice: "in," not "of." They're different.
			if (entity.__lookupSetter__(p)) {
				entity[p] = data[p];
			} else {
				entity.data[p] = data[p];
			}
		}
		if(data.hasController) {
			diagram.attachments.inputManager.deselectEntity(entity);
		}
		diagram.draw();
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

	if(msg.hasOwnProperty("requestID")) {
		//Message is a response to a request - look for callback
		if (pendingCallbacks.hasOwnProperty(msg.requestID)) {
			pendingCallbacks[msg.requestID](msg);
			delete pendingCallbacks[msg.id];
		}
	} else if(msg.hasOwnProperty("type")) {
		//Message is a request from the server - look for handler
		if(!requestTypes.hasOwnProperty(msg.type)) {
			console.error("Socket: recieved message with invalid type: ", msg.type);
		}
		requestTypes[msg.type](msg.data);
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
			//TODO: was I gonna put something here?
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

/**
 * Send a WebSocket message to the server.
 * @param {Object} msg the message to send to the server
 * @param {Function} [callback] callback to run when the response is received
 * @returns 
 */
export function send(msg, callback) {
	if(!isOpen) {
		console.error("Socket: attempt to send message while socket closed!");
		return;
	}
	const id = uniqueID();
	msg.requestID = id;
	if(callback) {
		pendingCallbacks[id] = callback;
	}
	socket.send(JSON.stringify(msg));
	//console.log("Sent message: ", msg);
}

///////////////////////////////////////////////////////////
//FUNCTIONS MANAGING UPDATE QUEUE, FOR RATE LIMITING

//Minimum time (in ms) between update broadcasts
const UPDATE_INTERVAL = 250;
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
It gets cleared out any time unblockUpdatesAndSend runs.
TODO: this is memory-inefficient. Fix sometime?
*/

function unblockUpdatesAndSend() {
	if (Object.keys(pendingUpdates).length > 0) {
		for (const [c, o] of Object.entries(pendingUpdates)) {
			sendUpdates(c, Object.values(o));
			delete pendingUpdates[c];
		}
		window.setTimeout(unblockUpdatesAndSend, UPDATE_INTERVAL);
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

/**
 * Registers data to be changed on the server via an update request.
 * Applies rate limiting: requests are only sent every UPDATE_INTERVAL seconds
 * @param {string} collection the server collection to update
 * @param  {...object} objects object data to update
 */
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
		window.setTimeout(unblockUpdatesAndSend, UPDATE_INTERVAL);
	}
}