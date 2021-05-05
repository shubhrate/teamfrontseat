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

/*
Get all current entities and redraw diagram.
*/
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

///////////////////////////////////////////////////////////
//FUNCTIONS MANAGING EDIT MENU EVENT LISTENERS

function createRequestedPlayer() {
	var col = playerColors[Math.floor(Math.random() * playerColors.length)];
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
	send({
		type: "getOne",
		collection: "entities",
		data: {name: document.getElementById("nameToRemove").value}
	}, function(data) {
		console.log("received data from request");
		playerToRemove = data.result;
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

function downloadDiagram(diagram){
	var a = document.createElement("a");
	document.body.appendChild(a);
	a.style = "display: none";
	send({
		type: "getAll",
		collection: "entities",
		data: {diagramID: diagram.diagramID}
	}, function(currentEntities){
		var stringified = JSON.stringify(currentEntities.result);
		var blob = new Blob([stringified], {type : "application/json"});
		var url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = "export.json";
		a.click();
		setTimeout(function() {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 0);
	});
}

function removeEntities(entitiesToRemove) {
	for (var i = 0; i < entitiesToRemove.length; i++){
		send({
			type: "remove",
			collection: "entities",
			data: {id: entitiesToRemove[i].id, diagramID: entitiesToRemove[i].diagramID}
		}, function(data) {
			console.log("entity removed for import");
		});
	}
}

function createEntities(entitiesToCreate){
	for (var i = 0; i < entitiesToCreate.length; i++){
		send({
			type: "createInstance",
			collection: "entities",
			data: entitiesToCreate[i]
		}, function(data){
			console.log("new entity imported");
		});
	}
}

function importDiagram(importFile){
	var file = importFile.files[0];
	const reader = new FileReader();
	reader.readAsText(file);
	reader.onload = function() {
		var newEntities = JSON.parse(reader.result); 
		send({
			type: "getAll",
			collection: "entities",
			data: {diagramID: newEntities[0].diagramID}
		}, function(data){
			var currentEntities = data.result;
			removeEntities(currentEntities);
		});			
		createEntities(newEntities);	
	}
}

function highlightOption(optionToHighlight, optionsToDeactivate){
	for (var i = 0; i < optionsToDeactivate.length; i++){
		document.getElementById(optionsToDeactivate[i]).classList.remove("active");
	}
	document.getElementById(optionToHighlight).classList.add("active");
}

function switchForms(formToShow, formToHide){
	document.getElementById(formToShow).style.display="block";
	hideForms([formToHide]);
}

function hideForms(forms){
	for (var i = 0; i < forms.length; i++) {
		document.getElementById(forms[i]).style.display="none";
	}
}

function addAddPlayerEventListener() {
	document.getElementById("addPlayerOption").addEventListener("click",
	function() {
		highlightOption("addPlayerOption", ["removePlayerOption", "downloadDiagramOption", "importDiagramOption"]);
		switchForms("addPlayerForm", "removePlayerForm");
		document.getElementById("playerSubmitButton").addEventListener("click",
		function(e){
			e.preventDefault();
			createRequestedPlayer();
		});
	});
}

function addRemovePlayerEventListener(){
	document.getElementById("removePlayerOption").addEventListener("click",
	function(){
		highlightOption("removePlayerOption", ["addPlayerOption", "downloadDiagramOption", "importDiagramOption"]);
		switchForms("removePlayerForm", "addPlayerForm");
		document.getElementById("playerRemoveButton").addEventListener("click",
		function(e){
			e.preventDefault();
			removeRequestedPlayer();
		});
	});
}

function addDownloadDiagramEventListener(diagram){
	document.getElementById("downloadDiagramOption").addEventListener("click",
	function(){
		highlightOption("downloadDiagramOption", ["addPlayerOption", "removePlayerOption", "importDiagramOption"]);
		hideForms(["addPlayerForm", "removePlayerForm"]);
		downloadDiagram(diagram);
		console.log("your file has been saved!");
	});
}

function addImportDiagramEventListener(){
	document.getElementById("importDiagramOption").addEventListener("click",
	function(){
		highlightOption("importDiagramOption", ["addPlayerOption", "removePlayerOption", "downloadDiagramOption"]);
		hideForms(["addPlayerForm", "removePlayerForm"]);

		var importFile = document.createElement("input");
		importFile.type = "file";
		importFile.accept=".json";

		importFile.onchange = e => {
			e.preventDefault();
			importDiagram(importFile);
			console.log("your diagram has been uploaded!");
		}
		importFile.click();
	});
}


export function addEditEventListeners(diagram) {
	hideForms(["addPlayerForm", "removePlayerForm"]);
	
	addAddPlayerEventListener();
	addRemovePlayerEventListener();
	addDownloadDiagramEventListener(diagram);
	addImportDiagramEventListener(diagram);
}