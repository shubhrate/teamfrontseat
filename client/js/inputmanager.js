//Manages... input.
//This might only turn out to be useful for prototyping, but still.

import {pythag} from "./util.js";
import {queueUpdate, send} from "./webclient.js";

//Should this move to webclient.js?
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
		diagram.attach("inputManager", this);
		this.scrollSpeed = 0.05;
		this.selectedEntities = [];
		this.controlledEntity = null;

		this.diagram.canvas.addEventListener(
			"wheel",
			(e) => this.onWheel(e)
		);
		this.diagram.canvas.addEventListener(
			"mousedown",
			(e) => this.onMouseDown(e)
		);
		this.diagram.canvas.addEventListener(
			"mousemove",
			(e) => this.onMouseMove(e)
		);
		//Prevent context menu showing up on right-click
		this.diagram.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
	}

	/**
	 * Finds any entities under the mouse pointer.
	 * Entities get a circle of Entity.size around themselves.
	 * @param ev the mouse event.
	 * @returns {Object[]} an array of entities under the mouse.
	 */
	getFocusedEntities(ev) {
		let eList = [];
		for(const ent of this.diagram.entities) {
			const dist = pythag(ent.screenX - ev.offsetX, ent.screenY - ev.offsetY);
			if(dist < ent.size * this.diagram.scale / 2) {
				eList.push(ent);
			}
		}
		return eList;
	}

	/**
	 * Selects one or more entities
	 * @param {...Object} ents the entity/entities to select
	 */
	selectEntity(...ents) {
		for(const s of ents) {
			if(!s.hasController) {
				s.selected = true;
				if (!this.selectedEntities.includes(s)) {
					this.selectedEntities.push(s);
				}
			}
		}
	}

	/**
	 * Deselects one or more entities
	 * @param  {...Object} ents the entity/entities to deselect
	 */
	deselectEntity(...ents) {
		for(const s of ents) {
			s.selected = false;
			const selectIndex = this.selectedEntities.indexOf(s);
			if(selectIndex >= 0) {
				this.selectedEntities.splice(selectIndex, 1);
			}
		}
	}

	/**
	 * Deselects all entities
	 */
	deselectAll() {
		for(const s of this.selectedEntities) {
			s.selected = false;
		}
		this.selectedEntities = [];
	}

	/**
	 * Sets/unsets which entity is controlled by the local controller
	 * @param {Object} ent the entity to update
	 */
	setControlledEntity(ent) {
		let msg = {
			"collection": "entities",
			"data": {
				"id": ent.data.id,
				"diagramID": ent.data.diagramID,
			}
		};
		if(this.controlledEntity === ent) {
			ent.hasController = false;
			this.controlledEntity = null;
			msg.type = "quitPlayer";
		} else if(!ent.hasController) {
			ent.hasController = true;
			if(this.controlledEntity)
				this.controlledEntity.hasController = false;
			this.controlledEntity = ent;
			this.deselectEntity(ent);
			msg.type = "newPlayer";
			Object.assign(msg.data, {
				"posX": ent.posX,
				"posY": ent.posY,
				"angle": ent.angle
			});
		} else return;
		send(msg);
	}

	///////////////////////////////////
	//INPUT EVENT HANDLERS

	onWheel(e) {
		e.preventDefault();
		const focus = this.selectedEntities.length > 0 ? this.selectedEntities : this.getFocusedEntities(e);
		const delta = e.deltaY * this.scrollSpeed;

		if(focus.length > 0) { //Scroll wheel is rotating entities
			for(const f of focus) {
				if(!f.hasController) {
					f.angle = f.angle + (delta * Math.PI * 0.02) % (Math.PI * 2);
				}
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
		let focus = this.getFocusedEntities(e);

		if(e.button == 0) { //Left-click
			let focusHasSelectedEnt = false;
			for(const {selected} of focus) {
				focusHasSelectedEnt = focusHasSelectedEnt || selected;
			}
			if(!e.ctrlKey && !focusHasSelectedEnt) {
				this.deselectAll();
			}
			if(focus.length > 0) {
				this.selectEntity(...focus);
			}
		} else if(e.button == 2) { //Right-click
			if(focus.length == 1) this.setControlledEntity(focus[0]);
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