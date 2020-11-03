import entityClassMap from "./entity.js";
import EntityDraw from "./entitydraw.js";

//Manages entities and the canvas they're drawn on.
//Does conversions from stage to screen space.

export default class Diagram {
	/**
	 * Creates a new Diagram and gives it a canvas to draw on.
	 * @param {string} id the id of this diagram's canvas element
	 * @param {Object[]} [entList] optional initial array of entity data objects
	 */
	constructor(id, entList) {
		this.canvas = document.getElementById(id);
		this.ctx = this.canvas.getContext("2d");

		//Position & scale of viewport
		this._windowX = 0;
		this._windowY = 0;
		this._scale = 100; //scale factor: px/unit

		this.visibilities = {
			grid: true,
			stage: true,
			entities: true
		};

		this.entities = [];
		if (entList !== undefined) {
			this.addUnclassifiedEntity(...entList);
		}
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

	//TODO: this function.
	manageResize() {
		
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
			const e = new entityClassMap[o.class](o);
			this.updateEntityPosition(e);
			this.entities.push(e);
		}
	}

	//TODO: this method assumes that one day entities will be assigned
	//unique IDs, probably UUIDs. Because JavaScript has no integrated UUID
	//generator, I put this off. Finish this.
	/**
	 * Gets an entity... by its ID.
	 * @param id the id of the entity to get
	 */
	getEntityById(id) {
		for(const e of this.entities) {
			if(e.data.id === id) return e;
		}
		return false;
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
		EntityDraw[ent.data.drawType](ent, this.ctx);
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