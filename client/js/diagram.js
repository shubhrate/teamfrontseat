import entityClassMap from "./entity.js";
import EntityDraw from "./entitydraw.js";
import {uniqueID} from "./util.js";

//Manages entities and the canvas they're drawn on.
//Does conversions from stage to screen space.

export default class Diagram {
	/**
	 * Creates a new Diagram and gives it a canvas to draw on.
	 * @param {string} id the id of this diagram's canvas element
	 * @param {Object[]} [entList] optional initial array of entity data objects
	 */
	constructor(id, canvas, entList) {
		this.id = id;
		this.canvas = canvas;
		this.ctx = this.canvas.getContext("2d");
		this.container = null; //Containing element to fill

		//Position & scale of viewport
		this._windowX = 0;
		this._windowY = 0;
		this._scale = 100; //scale factor: px/unit

		this.visibilities = {
			grid: true,
			stage: true,
			entities: true
		};

		//Map to classes which have control over diagram
		this.attachments = {};

		this.entities = [];
		if (entList !== undefined) {
			this.addUnclassifiedEntity(...entList);
		}
	}

	/**
	 * Declares a class that has control over this diagram
	 * @param {string} type the class type of the object
	 * @param {Object} obj the object to attach
	 */
	attach(type, obj) {
		this.attachments[type] = obj;
	}

	///////////////////////////////////
	//METHODS FOR MANAGING ELEMENT AND VIEWPORT SIZE

	//Getters and setters for element height and width
	get width() {return this.canvas.width;}
	get height() {return this.canvas.height;}
	set width(val) {
		this.canvas.width = val;
		this.manageResize();
	}
	set height(val) {
		this.canvas.height = val;
		this.manageResize();
	}

	/**
	 * Reset the diagram canvas size to fit its container, or the browser window
	 * if no container is defined.
	 * @param {HTMLElement} [container] set a new container.
	 */
	resizeToFill(container) {
		if(container instanceof HTMLElement) this.container = container;
		if(this.container) {
			this.canvas.width = this.container.clientWidth;
			this.canvas.height = this.container.clientHeight;
		} else {
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
		}
		this.manageResize();
	}

	//TODO: this function. (?)
	manageResize() {
		this.draw();
	}

	//Setters for viewport position and scale
	get windowX() {return this._windowX;}
	get windowY() {return this._windowY;}
	get scale() {return this._scale;}
	set windowX(val) {
		this._windowX = val;
		this.updateEntityPositions();
	}
	set windowY(val) {
		this._windowY = val;
		this.updateEntityPositions();
	}
	set scale(val) {
		this._scale = val;
		this.updateEntityPositions();
	}

	///////////////////////////////////
	//METHODS FOR MANIPULATING ENTITIES

	/**
	 * Wraps one or more entity data objects in relevant class and adds them to
	 * the diagram.
	 * @param {...Object} objects entity data objects to be added
	 */
	addUnclassifiedEntity(...objects) {
		for(const o of objects) {
			var entity;
			if(!o.id) { //If it doesn't have an ID, give it one.
				o.id = uniqueID();
			}
			if (o.class) {
				entity = new entityClassMap[o.class](o);
			} else {
				entity = new entityClassMap[o["0"].class](o);
				//console.log("the class of the entity is not defined");
				console.log(o["0"].class);
			}
			this.updateEntityPosition(entity);
			this.entities.push(entity);
		}
	}

	/**
	 * Wraps one or more entity objects in relevant class and removes them from
	 * the diagram.
	 * @param  {...any} objects entity data objects to be removed
	 */
	removeEntity(...objects) {
		for (const o of objects) {
			for (var i = 0; i < this.entities.length; i++) {
				if (this.entities[i].id == o.id) {
					this.entities.splice(i);
				}
			}
		}
	}

	/**
	 * Gets an entity... by its ID.
	 * @param id the id of the entity to get
	 */
	getEntityById(id) {
		for(const e of this.entities) {
			if(e.data.id === id) return e;
		}
	}
		
	/**
	 * Updates the screen space position of an entity.
	 * @param ent the updated entity
	 */
	updateEntityPosition(ent) {
		ent.screenX = (ent.posX + this.windowX) * this.scale;
		ent.screenY = (ent.posY + this.windowY) * this.scale;
		ent.screenSize = ent.size * this.scale;
		ent.moved = false;
	}

	/**
	 * Updates the screen space position of all entities.
	 */
	updateEntityPositions() {
		for(const e of this.entities) {
			this.updateEntityPosition(e);
		}
	}

	/**
	 * Dumps entity data into an array for easy JSON stringification.
	 * @returns {Object[]} An array of entity data objects
	 */
	exportEntities() {
		let entList = [];
		for(const e of this.entities) {
			entList.push(e.data);
		}
		return entList;
	}

	///////////////////////////////////
	//METHODS FOR DRAWING ON CANVAS

	clear() {
		this.ctx.clearRect(0, 0, this.width, this.height);
	}

	drawEntity(ent) {
		if(ent.moved) {
			this.updateEntityPosition(ent);
		}
		if (ent.data.drawType){
			EntityDraw[ent.data.drawType](ent, this.ctx);
		} else {
			EntityDraw[ent.data["0"].drawType](ent, this.ctx);
		}
				
	}

	drawEntities() {
		for(const e of this.entities) {
			this.drawEntity(e);
		}
	}

	drawGrid() {
		const scaledX = this.windowX * this.scale;
		const scaledY = this.windowY * this.scale;

		//Draw grid lines
		this.ctx.strokeStyle = "#e0e0e0";
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		for(let x = scaledX % this.scale; x < this.width; x += this.scale) {
			this.ctx.moveTo(x, 0);
			this.ctx.lineTo(x, this.height);
		}
		for (let y = scaledY % this.scale; y < this.width; y += this.scale) {
			this.ctx.moveTo(0, y);
			this.ctx.lineTo(this.width, y);
		}
		this.ctx.stroke();

		//Draw lines at origin
		this.ctx.strokeStyle = "#808080";
		this.ctx.lineWidth = 3;
		if(0 <= scaledX && scaledX <= this.width) {
			this.ctx.beginPath();
			this.ctx.moveTo(scaledX, 0);
			this.ctx.lineTo(scaledX, this.height);
			this.ctx.stroke();
		}
		if(0 <= scaledY && scaledY <= this.height) {
			this.ctx.beginPath();
			this.ctx.moveTo(0, scaledY);
			this.ctx.lineTo(this.width, scaledY);
			this.ctx.stroke();
		}
	}

	drawStage() {
		//background scene plot
	}

	draw() {
		this.clear();
		if(this.visibilities.grid) this.drawGrid();
		if(this.visibilities.stage) this.drawStage();
		if(this.visibilities.entities) this.drawEntities();
	}
}