import Diagram from "./js/diagram.js";
import InputManager from "./js/inputmanager.js";
import * as client from "./js/webclient.js";
import {address} from "./js/_addr.js";

document.getElementById("mainBody").onload = function startProgram() {
	const canvas = document.getElementById("diagram");
	const diagram = new Diagram("1", canvas);
	
	drawDiagram();
	addResizeEventListener();
	openClientConnection();

	//SET UP DIAGRAM///////////////////////////////////////////

	//TODO / NOTE: diagramID will likely be in uniqueID format later
	function drawDiagram(){
		client.registerDiagram(diagram);
		diagram.resizeToFill();
		diagram.windowX = diagram.width / diagram.scale / 2;
		diagram.windowY = diagram.height / diagram.scale / 2;
	
		new InputManager(diagram);
		diagram.draw();
	}
	
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
	
	function addResizeEventListener(){
		window.addEventListener("resize", resize);
	}	
	
	//CONNECT TO SERVER, GET DIAGRAM CONTENTS//////////////////
	function openClientConnection() {
		client.open(address, () => {
			if (document.URL.includes("edit.html")) { //one edit HTML page for all possible edit options
				client.addEditEventListeners(diagram);
			}
			client.refreshDiagram(diagram);
		});
	}
}