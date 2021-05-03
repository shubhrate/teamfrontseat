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
import {address} from "./_addr.js";

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
	},
	/*
	Add an entity to the diagram.
	DATA: entity/diagram id and the attributes to be added to new entity.
	*/
	"entity_add": function(data) {
		const diagram = diagrams[data.diagramID];
		diagram.addUnclassifiedEntity([data]);
		refreshDiagram(diagram);
	},
	/*
	Remove an entity from the diagram.
	DATA: entity/diagram id and the attributes of the entity to be removed.
	*/
	"entity_remove": function(data) {
		const diagram = diagrams[data.diagramID];
		diagram.removeEntity([data]);
		refreshDiagram(diagram);
	}
}

const playerColors = ["red", "blue", "purple", "green", "gray", "orange", "yellow"];

//TODO: this will want more detail if we enable users to "log into" diagrams
export function registerDiagram(dg) {
	diagrams[dg.id] = dg;
}

export function refreshDiagram(dg) {
	send({
		type: "getAll",
		collection: "entities",
		data: {diagramID: "1"}
	}, function(data) {
		dg.addUnclassifiedEntity(...data.result);
		dg.draw();
	});
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
			console.log("Socket: closed");
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
	console.log("sent message of type: " + msg.type);
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

function createRequestedPlayer(col) {
	//send createInstance request message, in the entities collection
	send({
		type: "createInstance", 
		collection: "entities", 
		data: {
			id: uniqueID(), 
			diagramID: "1", 
			class: "actor", 
			drawType: "actor", 
			name: document.getElementById("name").value, 
			color: col, 
			color2: "dark" + col, 
			posX: 4, 
			posY: -1.5, 
			size: 0.75, 
			angle: 0
		}
	}, function(data){
		console.log("a player has been added!");
	});
}

function removeRequestedPlayer(){
	var playerToRemove;
	//send getOne request message, in the entities collection
	send({
		type: "getOne",
		collection: "entities",
		data: {name: document.getElementById("nameToRemove").value}
	}, function(data) {
		console.log("received data from request");
		playerToRemove = data.result;
		//use result from getOne to send remove request message
		send({
			type: "remove",
			collection: "entities",
			data: {
				id: playerToRemove.id,
				diagramID: playerToRemove.diagramID
			}
		}, function(data){
			console.log("a player has been removed!");
		});
	});
}

function exportDiagram(diagram) {
	var currentEntities = diagram.exportEntities();
	send({
		type: "writeToFile",
		fileName: document.getElementById("fileName").value,
		entities: currentEntities
	}, function(data){
		console.log("your diagram has been saved!");
	});
}

function importDiagram(fileName, diagram){
	exportDiagram(diagram);
	send({
		type: "readFile",
		fileName: fileName
	}, function(data){
		var newEntities = JSON.parse(data);
		send({
			type: "getAll",
			collection: "entities",
			data: {diagramID: newEntities[0].diagramID}
		}, function(currentEntities){
			currentEntities = JSON.parse(currentEntities);
			for (var i = 0; i < currentEntities.length; i++){
				send({
					type: "remove",
					collection: "entities",
					data: {id: currentEntities[i].id, diagramID: currentEntities[i].diagramID}
				});
			}
		});
		for (var i = 0; i < newEntities.length; i++){
			send({
				type: "createInstance",
				collection: "entities",
				data: newEntities[i]
			});
		}
		console.log("your diagram has been uploaded!");
	});
}

function hideForms(forms){
	for (var i = 0; i < forms.length; i++) {
		document.getElementById(forms[i]).style.display="none";
	}
}

function showForm(id){
	document.getElementById(id).style.display="block";
}

function activateOption(id){
	document.getElementById(id).classList.add("active");
}

function deactivateOptions(options){
	for (var i = 0; i < options.length; i++){
		document.getElementById(options[i]).classList.remove("active");
	}
}

function addAddPlayerEventListener() {
	//if add player option is clicked
	document.getElementById("addPlayerOption").addEventListener("click",
	function() {

		//set add player option to active so it is highlighted in red
		activateOption("addPlayerOption");
		deactivateOptions(["removePlayerOption", "exportDiagramOption"]);

		//show add player form and hide remove player form
		showForm("addPlayerForm");
		hideForms(["removePlayerForm", "exportDiagramForm"]);

		//if playerSubmitButton is clicked
		document.getElementById("playerSubmitButton").addEventListener("click",
		function(e){
			e.preventDefault();
			var col = playerColors[Math.floor(Math.random() * playerColors.length)];
			createRequestedPlayer(col);
		});
	});
}

function addRemovePlayerEventListener(){
	//if remove player option is clicked
	document.getElementById("removePlayerOption").addEventListener("click",
	function(){
	
		//set remove player option to active so it is highlighted in red
		activateOption("removePlayerOption");
		deactivateOptions(["addPlayerOption", "exportDiagramOption"]);

		//show remove player form and hide add player form
		showForm("removePlayerForm");
		hideForms(["addPlayerForm", "exportDiagramForm"]);

		//if player removeRemoveButton is clicked
		document.getElementById("playerRemoveButton").addEventListener("click",
		function(e){
			e.preventDefault();
			removeRequestedPlayer();
		});
	});
}

function addExportDiagramEventListener(diagram){
	//if export diagram option is clicked
	document.getElementById("exportDiagramOption").addEventListener("click",
	function(){
		
		//set export diagram option to active so it is highlighted in red
		activateOption("exportDiagramOption");
		deactivateOptions(["addPlayerOption", "removePlayerOption"]);

		showForm("exportDiagramForm");
		hideForms(["addPlayerForm", "removePlayerForm"]);

		document.getElementById("exportDiagramButton").addEventListener("click",
		function(e) {
			e.preventDefault();
			exportDiagram(diagram);
		})
	});
}

function addImportDiagramEventListener(diagram){
	var input = document.createElement("input");
	input.type = "file";
	input.onchange = e => {
		e.preventDefault();
		var fileName = e["path"]["0"]["files"]["0"].name;
		importDiagram(fileName, diagram);
	}
	input.click();
}

export function addEditEventListeners(diagram) {
	//hide both forms until an option is clicked
	hideForms(["addPlayerForm", "removePlayerForm", "exportDiagramForm"]);
	
	addAddPlayerEventListener();
	addRemovePlayerEventListener();
	addExportDiagramEventListener(diagram);
	addImportDiagramEventListener(diagram);
}


