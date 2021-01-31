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

//HANDLERS FOR DATA OF DIFFERENT TYPES. This is the important bit.
//New behaviors for how to handle incoming data are added here. This keeps
//these handlers in one place, rather than spread throughout the project files.
const requestTypes = {
	/*
	Get the complete list of entities on the diagram.
	DATA: an array of entity data objects.
	*/
	"entities_set": {
		modules: ["diagram"],
		handler: function(data, app) {
			app.diagram.entities = [];
			app.diagram.addUnclassifiedEntity(...data);
			app.diagram.draw();
		}
	},
	/*
	Update one or more properties of one entity
	DATA: entity id and the attributes to be updated, in a flat object.
	*/
	"entity_update": {
		modules: ["diagram"],
		handler: function(data, app) {
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
}

//Now here's the actual class.
export default class WebClient {
	constructor(url, openCallback, errorCallback, appModules = {}) {
		this.url = url;
		this.isOpen = false;
		this.socket = undefined;
		
		this.openCallback = undefined;
		this.errorCallback = undefined;
		this.closeCallback = undefined;

		this.requestCallbacks = [];

		this.appModules = appModules; //A map to the classes in this project
		//TODO: this pattern indicates a project in need of a refactor towards
		//a less strongly object-oriented paradigm, or at least a
		//reshuffle towards a more sane hierarchy of modules.

		//Sets initial values of socket, openCallback, errorCallback
		this.open(openCallback, errorCallback);
	}

	//TODO: We probably want some default open/close messages to ping the
	//server and let it know about the connection of a new client, so that it
	//can immediately hand over all the data we need to get up to speed.

	open(openCallback, errorCallback) {
		if(!this.isOpen) {
			this.socket = new WebSocket(this.url);
			if(openCallback) this.openCallback = openCallback;
			if(errorCallback) this.errorCallback = errorCallback;

			this.socket.onopen = () => this.onWSOpen();
			this.socket.onclose = () => this.onWSClose();
			this.socket.onmessage = () => this.onWSMessage();
			this.socket.onerror = () => this.onWSError();

			this.isOpen = true;
		}
	}

	close(closeCallback) {
		if(this.isOpen) {
			this.closeCallback = closeCallback;
			this.socket.close();
			this.isOpen = false;
		}
	}

	send(msg) {
		if(this.isOpen) {
			this.socket.send(JSON.stringify(msg));
		}
	}

	//TODO: at some point, there will be user management involved in this
	//project. Do that.

	///////////////////////////////////
	//SOCKET EVENT HANDLERS

	onWSOpen() {
		this.isOpen = true;
		if(this.openCallback) this.openCallback();
	}

	onWSClose() {
		this.isOpen = false;
		if(this.closeCallback) this.closeCallback();
	}

	onWSError() {
		if (this.errorCallback) this.errorCallback();
	}

	onWSMessage() {
		const msg = JSON.parse(evt.data);

		//Validate request type
		if(!requestTypes.hasOwnProperty(msg.type)) {
			throw new Error(`received unspecified response type: ${msg.type}`);
		}
		const requestType = requestTypes[msg.type];

		//Check module requirements
		for(const m in requestType.modules) {
			if(!this.appModules.hasOwnProperty(m)) {
				throw new Error(`request type ${msg.type} requires module ${m}`);
			}
		}

		requestType.handler(msg.data, this.appModules);
	}
}