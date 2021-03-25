import Diagram from "./js/diagram.js";
import InputManager from "./js/inputmanager.js";
import Animator from "./js/animator.js";
import * as client from "./js/webclient.js";

import {address} from "./js/_addr.js";

//SET UP DIAGRAM///////////////////////////////////////////

const canvas = document.getElementById("diagram");
const diagram = new Diagram("1", canvas);
//TODO / NOTE: diagramID will likely be in uniqueID format later
client.registerDiagram(diagram);
diagram.resizeToFill();
diagram.windowX = diagram.width / diagram.scale / 2;
diagram.windowY = diagram.height / diagram.scale / 2;

new InputManager(diagram);
diagram.draw();

//RESIZE MANAGER!//////////////////////////////////////////

const RESIZE_INTERVAL = 250;
let blockResize = false;
let resizeQueued = false;

function unblockResize() {
	if(resizeQueued) {
		diagram.resizeToFill();
		resizeQueued = false;
		window.setTimeout(unblockResize, RESIZE_INTERVAL);
	} else {
		blockResize = false;
	}
}

function resize() {
	if (blockResize) {
		resizeQueued = true;
	} else {
		diagram.resizeToFill();
		blockResize = true;
		window.setTimeout(unblockResize, RESIZE_INTERVAL);
	}
}

window.addEventListener("resize", resize);

//CONNECT TO SERVER, GET DIAGRAM CONTENTS//////////////////

client.open(address, () => {
	client.send({
		type: "getAll",
		collection: "entities",
		data: {diagramID: "1"}
	}, function(data) {
		diagram.addUnclassifiedEntity(...data.result);
		diagram.draw();
	});
	/*
	let player = {
		type: "new player",
		//id: "Jane Doe",
		collection: "users",
		data: {
			name: "Jane",
			mojoPort: 9003,
			mojoIpAddress: "localHost",
			id: "178376c1f97-f0fa6018"
		}
	};
	client.send(player);
	*/
});

/*
const animator = new Animator(diagram);
animator.animateCross(diagram.entities[3], 2000, 0, -3, Math.PI, 500);
animator.animatePath(diagram.entities[2], 2000, [1, 3, 2], [3, 2, 1], 0, (x) => Math.pow(x, 3));
*/