//Manages... input.
//This might only turn out to be useful for prototyping, but still.

import {pythag} from "./util.js";
import {queueUpdate} from "./webclient.js";

function updateEntitiesOnServer(entArray) {
	let entData = [];
	for(const e of entArray) {
		entData.push(e.data);
	}
	queueUpdate("entities", ...entData);
}

function updateEntityPropertiesOnServer(entArray, propArray) {
	let entData = [];
	for (const ent of entArray) {
		const dataObj = {
			"id": ent.data.id,
			"diagramID": ent.data.diagramID
		};
		for (const prop of propArray) {
			dataObj[prop] = ent.data[prop];
		}
		entData.push(dataObj);
	}
	queueUpdate("entities", ...entData);
}

export default class InputManager {
	/**
	 * Create an InputManager, attach it to a Diagram, and add event listeners.
	 * @param diagram the Diagram object to manage.
	 */
	constructor(diagram) {
		this.diagram = diagram;
		this.scrollSpeed = 0.05;
		this.selectedEntities = [];

		//Arrow functions mean "this" is this object, not the event.
		this.diagram.canvas.addEventListener("wheel", (e) => this.onWheel(e));
		this.diagram.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
		this.diagram.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
	}

	/**
	 * Finds any entities under the mouse pointer.
	 * Entities get a circle of Entity.size around themselves.
	 * @param ev the mouse event.
	 * @returns {Object[]} an array of entities under the mouse.
	 */
	focusEntity(ev) {
		let eList = [];
		for(const ent of this.diagram.entities) {
			const dist = pythag(ent.screenX - ev.offsetX, ent.screenY - ev.offsetY);
			if(dist < ent.size * this.diagram.scale / 2 && !ent.hasController) {
				eList.push(ent);
			}
		}
		return eList;
	}

	/**
	 * Selects or deselects a list of entities
	 * @param ents the entities to be changed
	 * @param select true or omitted if selecting; false if deselecting
	 */
	static selectEntities(ents, select = true) {
		for(const s of ents) {
			s.selected = select;
		}
	}

	///////////////////////////////////
	//INPUT EVENT HANDLERS

	onWheel(e) {
		e.preventDefault();
		const focus = this.selectedEntities.length > 0 ? this.selectedEntities : this.focusEntity(e);
		const delta = e.deltaY * this.scrollSpeed;

		if(focus.length > 0) { //Scroll wheel is rotating entities
			for(const f of focus) {
				f.angle = f.angle + (delta * Math.PI * 0.02) % (Math.PI * 2);
			}
			updateEntityPropertiesOnServer(focus, ["angle"]);
		} else { //Scroll wheel is zooming the viewport
			const newScale = Math.max(this.diagram.scale - delta, 1);
			const dimScale = this.diagram.scale / newScale;
			this.diagram.scale = newScale;
			this.diagram.windowX *= dimScale;
			this.diagram.windowY *= dimScale;
		}
		this.diagram.draw();
	}

	onMouseDown(e) {
		let focus = this.focusEntity(e);

		if(focus.length > 0) { //Click selects an entity
			InputManager.selectEntities(focus);
			for(const f of focus) {
				if(!this.selectedEntities.includes(f)) {
					this.selectedEntities.push(f);
				}
			}
		} else { //Click deselects all entities
			InputManager.selectEntities(this.selectedEntities, false);
			this.selectedEntities = [];
		}
		this.diagram.draw();
	}

	onMouseMove(e) {
		if(e.buttons & 1) { //Left-click is down
			if(this.selectedEntities.length > 0) { //Mouse is dragging entities
				for(const s of this.selectedEntities) {
					s.posX += e.movementX / this.diagram.scale;
					s.posY += e.movementY / this.diagram.scale;
				}
				updateEntityPropertiesOnServer(this.selectedEntities, ["posX", "posY"]);
			} else { //Mouse is dragging the viewport
				this.diagram.windowX += e.movementX / this.diagram.scale;
				this.diagram.windowY += e.movementY / this.diagram.scale;
			}
			this.diagram.draw();
		}
	}
}